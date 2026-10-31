import { isValidPhone, MemoryWindow, normalizePhone, RateLimiter } from './rate-limiter';

describe('RateLimiter (memory, no REDIS_URL)', () => {
	it('allows up to the limit, then rejects', async () => {
		const limiter = new RateLimiter('test', 3, 60_000);
		await limiter.consume('ip');
		await limiter.consume('ip');
		await limiter.consume('ip');
		expect(await limiter.isLimited('ip')).toBe(true);
		await expect(limiter.consume('ip')).rejects.toThrow('Too many attempts');
	});

	it('counts keys separately and can be reset', async () => {
		const limiter = new RateLimiter('test', 1, 60_000);
		await limiter.hit('a');
		expect(await limiter.isLimited('a')).toBe(true);
		expect(await limiter.isLimited('b')).toBe(false);
		await expect(limiter.assert('a')).rejects.toThrow('Too many attempts');
		await limiter.reset('a');
		expect(await limiter.isLimited('a')).toBe(false);
	});
});

describe('MemoryWindow', () => {
	it('sweep removes keys with only old hits', () => {
		jest.useFakeTimers();
		const window = new MemoryWindow(5, 1000);
		window.hit('old');
		jest.advanceTimersByTime(1001);
		window.hit('new');
		window.sweep();
		expect(window.size).toBe(1);
		jest.useRealTimers();
	});

	it('forgets hits older than the window', () => {
		jest.useFakeTimers();
		const window = new MemoryWindow(1, 1000);
		expect(window.take('k')).toBe(true);
		expect(window.take('k')).toBe(false);
		jest.advanceTimersByTime(1001);
		expect(window.isLimited('k')).toBe(false);
		jest.useRealTimers();
	});
});

describe('phone helpers', () => {
	it('normalizes formatted and local numbers', () => {
		expect(normalizePhone('+998 (90) 123-45-67')).toBe('998901234567');
		expect(normalizePhone('901234567')).toBe('998901234567'); // 9-digit Uzbek local number
		expect(normalizePhone('+82 10-1234-5678')).toBe('821012345678');
	});

	it('accepts 10-15 digit international numbers only', () => {
		expect(isValidPhone('998901234567')).toBe(true);
		expect(isValidPhone('12345')).toBe(false);
		expect(isValidPhone('9989012345678901')).toBe(false);
	});
});
