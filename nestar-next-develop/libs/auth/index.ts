import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { LOGIN, LOGIN_WITH_CODE, RESET_PASSWORD, SIGN_UP, VERIFY_ADMIN_LOGIN } from '../../apollo/user/mutation';
import { GET_ME } from '../../apollo/user/query';

/**
 * Session = short-lived access token (JWT, ~1h, kept in localStorage) + long-lived refresh token.
 * The refresh token is an httpOnly cookie set by the API: page scripts never see it, so an XSS cannot steal
 * a 30-day session. The Apollo link renews the access token before it expires (see apollo/client.ts).
 */
export function getJwtToken(): any {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
}

// sessions started before the cookie existed kept the refresh token here; it is sent once and removed
const LEGACY_REFRESH_KEY = 'refreshToken';

/** a session exists (its access token may be expired; the refresh cookie renews it) */
export function hasSession(): boolean {
	if (typeof window === 'undefined') return false;
	return !!localStorage.getItem('accessToken') || !!localStorage.getItem(LEGACY_REFRESH_KEY);
}

export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
}

/** true when the token is missing or expires within `skewSeconds` */
export const isTokenExpired = (token: string, skewSeconds = 30): boolean => {
	if (!token) return true;
	try {
		const { exp } = decodeJWT<CustomJwtPayload>(token);
		return !exp || exp * 1000 < Date.now() + skewSeconds * 1000;
	} catch (err) {
		return true;
	}
};

const graphqlError = (err: any) => new Error(err?.graphQLErrors?.[0]?.message ?? err.message);

/** stores the access token returned by login / signup / refresh / password reset and updates the user */
export const applySession = (session: { accessToken?: string } | null | undefined) => {
	if (!session?.accessToken) return;
	updateStorage({ jwtToken: session.accessToken });
	localStorage.removeItem(LEGACY_REFRESH_KEY);
	updateUserInfo(session.accessToken);
};

/** admins get no tokens from the password step: an SMS code is sent and must be confirmed with verifyAdminLogin */
export interface LoginResult {
	twoFactorRequired: boolean;
	memberNick?: string;
	devCode?: string;
}

export const logIn = async (nick: string, password: string): Promise<LoginResult> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN,
			variables: { input: { memberNick: nick, memberPassword: password } },
			fetchPolicy: 'network-only',
		});
		const login = result?.data?.login;
		if (login?.twoFactorRequired) return { twoFactorRequired: true, memberNick: login.memberNick, devCode: login.devCode ?? '' };
		applySession(login);
		return { twoFactorRequired: false };
	} catch (err: any) {
		// surface the backend message (wrong password, blocked user, too many attempts, ...)
		throw graphqlError(err);
	}
};

export const verifyAdminLogin = async (nick: string, code: string): Promise<void> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: VERIFY_ADMIN_LOGIN,
			variables: { input: { memberNick: nick, code } },
			fetchPolicy: 'network-only',
		});
		applySession(result?.data?.verifyAdminLogin);
	} catch (err: any) {
		throw graphqlError(err);
	}
};

/** password-less login with an SMS code sent to the account phone */
export const logInWithCode = async (phone: string, code: string): Promise<void> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN_WITH_CODE,
			variables: { input: { phone, code } },
			fetchPolicy: 'network-only',
		});
		applySession(result?.data?.loginWithCode);
	} catch (err: any) {
		throw graphqlError(err);
	}
};

interface SignUpInput {
	nick: string;
	password: string;
	phone: string;
	type: string;
	code: string;
}

export const signUp = async ({ nick, password, phone, type, code }: SignUpInput): Promise<void> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: SIGN_UP,
			variables: {
				input: { memberNick: nick, memberPassword: password, memberPhone: phone, memberType: type, verificationCode: code },
			},
			fetchPolicy: 'network-only',
		});
		applySession(result?.data?.signup);
	} catch (err: any) {
		throw graphqlError(err);
	}
};

export const resetPassword = async (phone: string, code: string, newPassword: string): Promise<void> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: RESET_PASSWORD,
			variables: { input: { phone, code, newPassword } },
			fetchPolicy: 'network-only',
		});
		applySession(result?.data?.resetPassword);
	} catch (err: any) {
		throw graphqlError(err);
	}
};

/**
 * Exchanges the refresh cookie for a new access token. Uses plain fetch (not Apollo) so it can run inside the
 * Apollo link chain. Returns the new access token or null when the session is over.
 * The API rotates the refresh token on every use, so tabs must not refresh at the same time (the second one would
 * present an already used token and log everybody out): a browser-wide lock lets one tab refresh, the others
 * then find the fresh access token in localStorage.
 */
let refreshing: Promise<string | null> | null = null;
export const refreshAccessToken = (): Promise<string | null> => {
	if (refreshing) return refreshing; // several requests in this tab share one refresh
	if (!hasSession() || !process.env.REACT_APP_API_GRAPHQL_URL) return Promise.resolve(null);

	const refresh = async (): Promise<string | null> => {
		const current = getJwtToken();
		if (current && !isTokenExpired(current)) return current; // another tab has just refreshed
		const legacyToken = localStorage.getItem(LEGACY_REFRESH_KEY);
		let data: any;
		try {
			const response = await fetch(process.env.REACT_APP_API_GRAPHQL_URL as string, {
				method: 'POST',
				credentials: 'include',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					query: 'mutation($t:String){refreshSession(refreshToken:$t){accessToken}}',
					variables: { t: legacyToken || null },
				}),
			});
			data = (await response.json())?.data;
		} catch (err) {
			return null; // network problem: keep the session, try again with the next request
		}
		const session = data?.refreshSession;
		if (!session?.accessToken) {
			clearSession();
			return null;
		}
		applySession(session);
		return session.accessToken as string;
	};

	const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined;
	refreshing = (locks ? (locks.request('marketauto-refresh', refresh) as Promise<string | null>) : refresh()).finally(() => {
		refreshing = null;
	});
	return refreshing;
};

/** a valid access token for requests that bypass Apollo (file uploads); renews an expired one first */
export const getFreshToken = async (): Promise<string> => {
	const token = getJwtToken();
	if (token && !isTokenExpired(token)) return token;
	return (await refreshAccessToken()) ?? '';
};

export const updateStorage = ({ jwtToken }: { jwtToken: any }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('login', Date.now().toString());
};

/**
 * Sets the user from the access token (id, nick, role, avatar) at once, then loads the full profile
 * (phone, name, counters, ...) with getMe. The token carries no personal data.
 */
export const updateUserInfo = (jwtToken: any) => {
	if (!jwtToken) return false;

	let claims: CustomJwtPayload;
	try {
		claims = decodeJWT<CustomJwtPayload>(jwtToken);
	} catch (err) {
		return false;
	}
	const previous = userVar();
	// same member: keep the profile already loaded until getMe answers
	const base = previous._id === claims._id ? previous : emptyUser;
	userVar({
		...base,
		_id: claims._id ?? '',
		memberType: claims.memberType ?? '',
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType ?? base.memberAuthType,
		memberNick: claims.memberNick ?? '',
		// empty when no photo: every avatar falls back to the default image itself
		memberImage: claims.memberImage ?? '',
		memberAdminRole: claims.memberAdminRole ?? '',
	});
	void loadMe(jwtToken);
	return true;
};

// layouts call updateUserInfo on every page: the profile is fetched again only for a new token or after a minute
let meLoadedFor = '';
let meLoadedAt = 0;
const loadMe = async (jwtToken: string): Promise<void> => {
	if (meLoadedFor === jwtToken && Date.now() - meLoadedAt < 60 * 1000) return;
	meLoadedFor = jwtToken;
	meLoadedAt = Date.now();
	try {
		const apolloClient = await initializeApollo();
		const { data } = await apolloClient.query({ query: GET_ME, fetchPolicy: 'network-only' });
		const me = data?.getMe;
		if (!me || me._id !== userVar()._id) return;
		userVar({
			...userVar(),
			memberType: me.memberType ?? '',
			memberStatus: me.memberStatus ?? '',
			memberAuthType: me.memberAuthType,
			memberPhone: me.memberPhone ?? '',
			memberNick: me.memberNick ?? '',
			memberFullName: me.memberFullName || '',
			memberImage: me.memberImage ?? '',
			memberAddress: me.memberAddress ?? '',
			memberDesc: me.memberDesc ?? '',
			memberProperties: me.memberProperties,
			memberRank: me.memberRank,
			memberArticles: me.memberArticles,
			memberLikes: me.memberLikes,
			memberViews: me.memberViews,
			memberPhoneVerified: !!me.memberPhoneVerified,
			memberTrusted: !!me.memberTrusted,
			memberAdminRole: me.memberAdminRole ?? '',
		});
	} catch (err) {
		meLoadedFor = ''; // try again next time
	}
};

/** ends the session on the server too, so the refresh token cannot be reused */
export const logOut = () => {
	if (hasSession() && process.env.REACT_APP_API_GRAPHQL_URL) {
		fetch(process.env.REACT_APP_API_GRAPHQL_URL, {
			method: 'POST',
			credentials: 'include',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				query: 'mutation($t:String){logout(refreshToken:$t)}',
				variables: { t: localStorage.getItem(LEGACY_REFRESH_KEY) || null },
			}),
			keepalive: true,
		}).catch(() => undefined);
	}
	clearSession();
	window.location.reload();
};

export const clearSession = () => {
	localStorage.removeItem('accessToken');
	localStorage.removeItem(LEGACY_REFRESH_KEY);
	meLoadedFor = '';
	window.localStorage.setItem('logout', Date.now().toString());
	deleteUserInfo();
};

const emptyUser: CustomJwtPayload = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberAuthType: '',
	memberPhone: '',
	memberNick: '',
	memberFullName: '',
	memberImage: '',
	memberAddress: '',
	memberDesc: '',
	memberProperties: 0,
	memberRank: 0,
	memberArticles: 0,
	memberLikes: 0,
	memberViews: 0,
	memberPhoneVerified: false,
	memberTrusted: false,
	memberAdminRole: '',
};

const deleteUserInfo = () => {
	userVar({ ...emptyUser });
};
