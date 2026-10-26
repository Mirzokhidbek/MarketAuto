import { HttpException, HttpStatus } from '@nestjs/common';
import { Message } from './enums/common.enum';

/**
 * Small in-memory sliding-window limiter (one API instance).
 * For several instances behind a load balancer move the counters to Redis.
 */
export class RateLimiter {
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

	/** throws 429 when the key already reached the limit */
	public assert(key: string): void {
		if (this.isLimited(key)) throw new HttpException(Message.TOO_MANY_ATTEMPTS, HttpStatus.TOO_MANY_REQUESTS);
	}

	public hit(key: string): void {
		const list = this.recent(key);
		list.push(Date.now());
		this.hits.set(key, list);
	}

	/** assert + hit in one call, for actions limited on every attempt */
	public consume(key: string): void {
		this.assert(key);
		this.hit(key);
	}

	public reset(key: string): void {
		this.hits.delete(key);
	}
}

const MINUTE = 60 * 1000;
// per-IP limits are strict in production; in development many tests run from one IP (localhost)
const ipFactor = process.env.NODE_ENV === 'production' ? 1 : 20;

export const limiters = {
	// wrong passwords per nick and per IP
	loginNick: new RateLimiter(5, 15 * MINUTE),
	loginIp: new RateLimiter(30 * ipFactor, 15 * MINUTE),
	signupIp: new RateLimiter(10 * ipFactor, 60 * MINUTE),
	// SMS codes per phone and per IP
	smsPhone: new RateLimiter(3, 10 * MINUTE),
	smsIp: new RateLimiter(10 * ipFactor, 60 * MINUTE),
	// wrong SMS codes per phone
	codeCheck: new RateLimiter(5, 15 * MINUTE),
	messages: new RateLimiter(30, MINUTE),
	reports: new RateLimiter(10, 60 * MINUTE),
};

/** "+998 (90) 123-45-67" -> "998901234567"; 9-digit local numbers get the Uzbek code */
export const normalizePhone = (phone: string): string => {
	const digits = String(phone ?? '').replace(/\D/g, '');
	return digits.length === 9 ? `998${digits}` : digits;
};

export const isValidPhone = (phone: string): boolean => /^\d{10,15}$/.test(phone);
