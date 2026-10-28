import { readCookie, REFRESH_COOKIE, setRefreshCookie } from './session-cookie';

describe('session cookie', () => {
	it('reads one cookie from the header', () => {
		expect(readCookie(`a=1; ${REFRESH_COOKIE}=abc%20def; b=2`, REFRESH_COOKIE)).toBe('abc def');
		expect(readCookie('a=1', REFRESH_COOKIE)).toBeUndefined();
		expect(readCookie(undefined, REFRESH_COOKIE)).toBeUndefined();
	});

	it('sets an httpOnly cookie limited to the GraphQL path', () => {
		const res = { cookie: jest.fn() };
		setRefreshCookie(res, 'token');
		expect(res.cookie).toHaveBeenCalledWith(
			REFRESH_COOKIE,
			'token',
			expect.objectContaining({ httpOnly: true, path: '/graphql', sameSite: 'lax' }),
		);
	});
});
