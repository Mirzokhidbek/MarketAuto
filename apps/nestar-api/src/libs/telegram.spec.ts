import { createHmac } from 'crypto';
import { telegramFullName, verifyInitData } from './telegram';

const TOKEN = '123456:TEST-token';
const NOW = 1_800_000_000_000;

/** builds initData exactly like Telegram signs it */
const sign = (fields: Record<string, string>, token = TOKEN): string => {
	const checkString = Object.entries(fields)
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join('\n');
	const secret = createHmac('sha256', 'WebAppData').update(token).digest();
	const hash = createHmac('sha256', secret).update(checkString).digest('hex');
	return new URLSearchParams({ ...fields, hash }).toString();
};

const user = JSON.stringify({ id: 42, first_name: 'Ali', last_name: 'Valiyev', username: 'ali' });
const fresh = { auth_date: String(NOW / 1000 - 60), query_id: 'AAE', user };

describe('verifyInitData', () => {
	it('accepts initData signed with the bot token', () => {
		expect(verifyInitData(sign(fresh), TOKEN, NOW)).toMatchObject({ id: 42, username: 'ali' });
	});

	it('refuses initData signed with another bot token', () => {
		expect(verifyInitData(sign(fresh, '999:other'), TOKEN, NOW)).toBeNull();
	});

	it('refuses a changed user', () => {
		const forged = sign(fresh).replace(encodeURIComponent('"id":42'), encodeURIComponent('"id":43'));
		expect(verifyInitData(forged, TOKEN, NOW)).toBeNull();
	});

	it('refuses initData older than a day', () => {
		expect(verifyInitData(sign({ ...fresh, auth_date: String(NOW / 1000 - 2 * 86400) }), TOKEN, NOW)).toBeNull();
	});

	it('refuses missing or malformed parts', () => {
		expect(verifyInitData('user=x', TOKEN, NOW)).toBeNull();
		expect(verifyInitData(sign({ auth_date: fresh.auth_date }), TOKEN, NOW)).toBeNull(); // no user
		expect(verifyInitData(sign({ ...fresh, user: 'not json' }), TOKEN, NOW)).toBeNull();
	});
});

describe('telegramFullName', () => {
	it('joins first and last name', () => {
		expect(telegramFullName({ id: 1, first_name: 'Ali', last_name: 'Valiyev' })).toBe('Ali Valiyev');
		expect(telegramFullName({ id: 1 })).toBeUndefined();
	});
});
