import { Cached, CachedByKey } from './cache';

describe('Cached', () => {
	it('loads once and reuses the value while it is fresh', async () => {
		const load = jest.fn().mockResolvedValue('a');
		const cached = new Cached(60_000, load);
		expect(await cached.get()).toBe('a');
		expect(await cached.get()).toBe('a');
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('shares one load between concurrent callers', async () => {
		const load = jest.fn().mockResolvedValue('a');
		const cached = new Cached(60_000, load);
		await Promise.all([cached.get(), cached.get(), cached.get()]);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('loads again after the time to live', async () => {
		const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
		const load = jest.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');
		const cached = new Cached(500, load);
		expect(await cached.get()).toBe('old');
		now.mockReturnValue(1_600);
		expect(await cached.get()).toBe('new');
		now.mockRestore();
	});

	it('loads again after clear()', async () => {
		const load = jest.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');
		const cached = new Cached(60_000, load);
		await cached.get();
		cached.clear();
		expect(await cached.get()).toBe('new');
	});

	it('does not keep a value that was loading when clear() was called', async () => {
		let finishOld!: (value: string) => void;
		const load = jest
			.fn()
			.mockReturnValueOnce(new Promise<string>((resolve) => (finishOld = resolve)))
			.mockResolvedValueOnce('new');
		const cached = new Cached(60_000, load);
		const pending = cached.get();
		cached.clear(); // a write happened while the old value was being read
		finishOld('old');
		await pending;
		expect(await cached.get()).toBe('new');
	});

	it('does not keep a failed load', async () => {
		const load = jest.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce('a');
		const cached = new Cached(60_000, load);
		await expect(cached.get()).rejects.toThrow('db down');
		expect(await cached.get()).toBe('a');
	});
});

describe('CachedByKey', () => {
	it('keeps one value per key', async () => {
		const load = jest.fn(async (brand: string) => [`${brand}-model`]);
		const cached = new CachedByKey(60_000, load);
		expect(await cached.get('KIA')).toEqual(['KIA-model']);
		expect(await cached.get('BMW')).toEqual(['BMW-model']);
		await cached.get('KIA');
		expect(load).toHaveBeenCalledTimes(2);
	});
});
