import { settings } from './env';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Message } from './enums/common.enum';
import { randomUUID } from 'node:crypto';
import { rateLimitBlocks } from './observability/metrics';
import { hashKey, redisReady } from './redis';

/** sliding window kept in this process: used without Redis, and while Redis is unreachable */
export class MemoryWindow {
	private readonly hits = new Map<string, number[]>();

	constructor(
		private readonly max: number,
		private readonly windowMs: number,
	) {}

	private recent(key: string): number[] {
		const now = Date.now();
		const list = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
		if (list.length) this.hits.set(key, list);
		else this.hits.delete(key);
		return list;
	}

	public isLimited(key: string): boolean {
		return this.recent(key).length >= this.max;
	}

	public hit(key: string): void {
		const list = this.recent(key);
		list.push(Date.now());
		this.hits.set(key, list);
	}

	/** true when allowed (and counted), false when the limit was already reached */
	public take(key: string): boolean {
		if (this.isLimited(key)) return false;
		this.hit(key);
		return true;
	}

	public reset(key: string): void {
		this.hits.delete(key);
	}

	/** drops keys whose hits are all outside the window (otherwise every IP/nick ever seen stays in memory) */
	public sweep(): void {
		for (const key of [...this.hits.keys()]) this.recent(key);
	}

	public get size(): number {
		return this.hits.size;
	}
}

// one round trip, atomic: two API instances cannot both let the last allowed attempt through
const TAKE_SCRIPT = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[3]) then return 0 end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
redis.call('PEXPIRE', KEYS[1], ARGV[2])
return 1`;

/**
 * Sliding-window limiter. With REDIS_URL the counters live in Redis (one sorted set per key), so the limits
 * hold across every API instance and survive restarts; without it, or while Redis is down, in memory.
 */
export class RateLimiter {
	public readonly memory: MemoryWindow;

	constructor(
		private readonly name: string,
		private readonly max: number,
		private readonly windowMs: number,
	) {
		this.memory = new MemoryWindow(max, windowMs);
	}

	private redisKey(key: string): string {
		return `rl:${this.name}:${hashKey(key)}`;
	}

	private blocked(): never {
		rateLimitBlocks.inc({ limiter: this.name });
		throw new HttpException(Message.TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
	}

	public async isLimited(key: string): Promise<boolean> {
		const connection = redisReady();
		if (connection) {
			try {
				const now = Date.now();
				const replies = await connection
					.multi()
					.zremrangebyscore(this.redisKey(key), 0, now - this.windowMs)
					.zcard(this.redisKey(key))
					.exec();
				return Number(replies?.[1]?.[1] ?? 0) >= this.max;
			} catch {
				/* Redis went away: the memory window below */
			}
		}
		return this.memory.isLimited(key);
	}

	/** throws 429 when the key already reached the limit */
	public async assert(key: string): Promise<void> {
		if (await this.isLimited(key)) this.blocked();
	}

	public async hit(key: string): Promise<void> {
		const connection = redisReady();
		if (connection) {
			try {
				const now = Date.now();
				await connection
					.multi()
					.zadd(this.redisKey(key), now, `${now}-${randomUUID()}`)
					.pexpire(this.redisKey(key), this.windowMs)
					.exec();
				return;
			} catch {
				/* memory below */
			}
		}
		this.memory.hit(key);
	}

	/** assert + hit in one step, for actions limited on every attempt */
	public async consume(key: string): Promise<void> {
		const connection = redisReady();
		if (connection) {
			try {
				const now = Date.now();
				const allowed = await connection.eval(
					TAKE_SCRIPT,
					1,
					this.redisKey(key),
					now,
					this.windowMs,
					this.max,
					`${now}-${randomUUID()}`,
				);
				if (Number(allowed) !== 1) this.blocked();
				return;
			} catch (error) {
				if (error instanceof HttpException) throw error;
			}
		}
		if (!this.memory.take(key)) this.blocked();
	}

	public async reset(key: string): Promise<void> {
		this.memory.reset(key);
		const connection = redisReady();
		if (connection) await connection.del(this.redisKey(key)).catch(() => undefined);
	}
}

const MINUTE = 60 * 1000;
// per-IP limits are strict in production; in development many tests run from one IP (localhost)
const ipFactor = settings.production ? 1 : 20;

export const limiters = {
	// wrong passwords per nick and per IP
	loginNick: new RateLimiter('loginNick', 5, 15 * MINUTE),
	loginIp: new RateLimiter('loginIp', 30 * ipFactor, 15 * MINUTE),
	signupIp: new RateLimiter('signupIp', 10 * ipFactor, 60 * MINUTE),
	// SMS codes per phone and per IP
	smsPhone: new RateLimiter('smsPhone', 3, 10 * MINUTE),
	smsIp: new RateLimiter('smsIp', 10 * ipFactor, 60 * MINUTE),
	// wrong SMS codes per phone
	codeCheck: new RateLimiter('codeCheck', 5, 15 * MINUTE),
	// email codes per address and per IP
	emailAddress: new RateLimiter('emailAddress', 3, 10 * MINUTE),
	emailIp: new RateLimiter('emailIp', 10 * ipFactor, 60 * MINUTE),
	messages: new RateLimiter('messages', 30, MINUTE),
	reports: new RateLimiter('reports', 10, 60 * MINUTE),
	// uploaded photos per member (a listing has at most 10; avatars, articles and chat photos share this)
	uploads: new RateLimiter('uploads', 100, 60 * MINUTE),
};

// stale keys are removed every 5 minutes; unref: this timer alone does not keep the process (or tests) running
setInterval(() => Object.values(limiters).forEach((limiter) => limiter.memory.sweep()), 5 * MINUTE).unref();

/** "+998 (90) 123-45-67" -> "998901234567"; 9-digit local numbers get the Uzbek code */
export const normalizePhone = (phone: string): string => {
	const digits = String(phone ?? '').replace(/\D/g, '');
	return digits.length === 9 ? `998${digits}` : digits;
};

export const isValidPhone = (phone: string): boolean => /^\d{10,15}$/.test(phone);

/** emails are compared in lower case without spaces */
export const normalizeEmail = (email: string): string =>
	String(email ?? '')
		.trim()
		.toLowerCase();

// one @, a dot in the domain, no spaces; length limit of RFC 5321
export const isValidEmail = (email: string): boolean =>
	email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
