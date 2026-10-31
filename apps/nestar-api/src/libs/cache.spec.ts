import { Cache } from './cache';

// no REDIS_URL in unit tests: the in-process store
describe('Cache (memory)', () => {
	it('loads once and serves the stored value until cleared', async () => {
		const cache = new Cache('test', 60);
		const load = jest.fn().mockResolvedValue({ phone: '+998 71 200 00 00' });
		expect(await cache.get('k', load)).toEqual({ phone: '+998 71 200 00 00' });
		expect(await cache.get('k', load)).toEqual({ phone: '+998 71 200 00 00' });
		expect(load).toHaveBeenCalledTimes(1);

		await cache.clear();
		await cache.get('k', load);
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('shares one load between concurrent misses', async () => {
		const cache = new Cache('test2', 60);
		let release: (value: number) => void = () => undefined;
		const load = jest.fn(() => new Promise<number>((resolve) => (release = resolve)));
		const both = Promise.all([cache.get('k', load), cache.get('k', load)]);
		await new Promise((resolve) => setImmediate(resolve));
		release(7);
		expect(await both).toEqual([7, 7]);
		expect(load).toHaveBeenCalledTimes(1);
	});

	it('expires entries after the TTL', async () => {
		jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
		const cache = new Cache('test3', 1);
		const load = jest.fn().mockResolvedValue(1);
		await cache.get('k', load);
		jest.advanceTimersByTime(1001);
		await cache.get('k', load);
		expect(load).toHaveBeenCalledTimes(2);
		jest.useRealTimers();
	});

	it('does not keep a failed load', async () => {
		const cache = new Cache('test4', 60);
		const load = jest.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValue(2);
		await expect(cache.get('k', load)).rejects.toThrow('db down');
		expect(await cache.get('k', load)).toBe(2);
	});
});
