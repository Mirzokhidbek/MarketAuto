import { isValidPhone, normalizePhone, RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
	it('allows up to the limit, then rejects', () => {
		const limiter = new RateLimiter(3, 60_000);
		limiter.consume('ip');
		limiter.consume('ip');
		limiter.consume('ip');
		expect(limiter.isLimited('ip')).toBe(true);
		expect(() => limiter.consume('ip')).toThrow('Too many attempts');
	});

	it('counts keys separately and can be reset', () => {
		const limiter = new RateLimiter(1, 60_000);
		limiter.hit('a');
		expect(limiter.isLimited('a')).toBe(true);
		expect(limiter.isLimited('b')).toBe(false);
		limiter.reset('a');
		expect(limiter.isLimited('a')).toBe(false);
	});

	it('forgets hits older than the window', () => {
		jest.useFakeTimers();
		const limiter = new RateLimiter(1, 1000);
		limiter.hit('k');
		jest.advanceTimersByTime(1001);
		expect(limiter.isLimited('k')).toBe(false);
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
