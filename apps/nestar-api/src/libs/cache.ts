import { cacheLookups } from './observability/metrics';
import { redisReady } from './redis';

interface Entry {
	value: string;
	expiresAt: number;
}

const MAX_MEMORY_ENTRIES = 2000;

/**
 * Read-through cache for data many visitors read and few change (site settings, the import tariff, car model
 * lists, ids of blocked sellers). Values are stored as JSON in Redis when REDIS_URL is set, so every API
 * instance shares them and one invalidation clears them everywhere; otherwise (or while Redis is down) in
 * this process. Concurrent misses for one key share one database call.
 */
export class Cache {
	private readonly memory = new Map<string, Entry>();
	private readonly pending = new Map<string, Promise<unknown>>();
	// bumping the version makes every old key unreachable at once (no SCAN over Redis keys)
	private memoryVersion = 0;

	constructor(
		private readonly name: string,
		private readonly ttlSeconds: number,
	) {}

	private async version(): Promise<string> {
		const connection = redisReady();
		if (!connection) return `m${this.memoryVersion}`;
		try {
			return `r${(await connection.get(`cache:${this.name}:version`)) ?? 0}`;
		} catch {
			return `m${this.memoryVersion}`;
		}
	}

	private async read(key: string): Promise<string | undefined> {
		const connection = redisReady();
		if (connection) {
			try {
				return (await connection.get(key)) ?? undefined;
			} catch {
				/* memory below */
			}
		}
		const entry = this.memory.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt > Date.now()) return entry.value;
		this.memory.delete(key);
		return undefined;
	}

	private async write(key: string, value: string): Promise<void> {
		const connection = redisReady();
		if (connection) {
			try {
				await connection.set(key, value, 'EX', this.ttlSeconds);
				return;
			} catch {
				/* memory below */
			}
		}
		// oldest first: Map keeps insertion order
		if (this.memory.size >= MAX_MEMORY_ENTRIES) this.memory.delete(this.memory.keys().next().value as string);
		this.memory.set(key, { value, expiresAt: Date.now() + this.ttlSeconds * 1000 });
	}

	public async get<T>(key: string, load: () => Promise<T>): Promise<T> {
		const fullKey = `cache:${this.name}:${await this.version()}:${key}`;
		const stored = await this.read(fullKey);
		if (stored !== undefined) {
			cacheLookups.inc({ cache: this.name, result: 'hit' });
			return JSON.parse(stored) as T;
		}
		cacheLookups.inc({ cache: this.name, result: 'miss' });

		const running = this.pending.get(fullKey);
		if (running) return (await running) as T;
		const loading = (async () => {
			const value = await load();
			await this.write(fullKey, JSON.stringify(value));
			return value;
		})();
		this.pending.set(fullKey, loading);
		try {
			return await loading;
		} finally {
			this.pending.delete(fullKey);
		}
	}

	/** after a change: the next read loads fresh data, on every instance */
	public async clear(): Promise<void> {
		this.memoryVersion++;
		this.memory.clear();
		const connection = redisReady();
		if (connection) await connection.incr(`cache:${this.name}:version`).catch(() => undefined);
	}
}

export const caches = {
	siteSettings: new Cache('siteSettings', 300),
	importTariff: new Cache('importTariff', 300),
	carModels: new Cache('carModels', 600),
	// read on every car list request; cleared when an admin blocks or unblocks a member
	hiddenSellers: new Cache('hiddenSellers', 60),
};
