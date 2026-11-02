/**
 * A value kept in memory for `ttlMs`, so hot read paths skip a database round trip.
 * Concurrent callers share one load; `clear()` after a write makes the next read load again
 * (a load already running when clear() is called is not cached). With several API instances
 * the others see a change after at most `ttlMs`.
 */
export class Cached<T> {
	private value: { data: T; at: number } | null = null;
	private loading: Promise<T> | null = null;
	private generation = 0;

	constructor(
		private readonly ttlMs: number,
		private readonly load: () => Promise<T>,
	) {}

	public async get(): Promise<T> {
		if (this.value && Date.now() - this.value.at < this.ttlMs) return this.value.data;
		if (!this.loading) {
			const generation = this.generation;
			this.loading = this.load()
				.then((data) => {
					if (generation === this.generation) this.value = { data, at: Date.now() };
					return data;
				})
				.finally(() => {
					if (generation === this.generation) this.loading = null;
				});
		}
		return this.loading;
	}

	public clear(): void {
		this.generation++;
		this.value = null;
		this.loading = null;
	}
}

/** one Cached per key (e.g. car models per brand) */
export class CachedByKey<K, T> {
	private readonly entries = new Map<K, Cached<T>>();

	constructor(
		private readonly ttlMs: number,
		private readonly load: (key: K) => Promise<T>,
	) {}

	public get(key: K): Promise<T> {
		let entry = this.entries.get(key);
		if (!entry) this.entries.set(key, (entry = new Cached(this.ttlMs, () => this.load(key))));
		return entry.get();
	}

	public clear(): void {
		this.entries.clear();
	}
}
