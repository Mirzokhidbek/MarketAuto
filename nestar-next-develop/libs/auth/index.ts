import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { userVar } from '../../apollo/store';
import { CustomJwtPayload } from '../types/customJwtPayload';
import { LOGIN, RESET_PASSWORD, SIGN_UP } from '../../apollo/user/mutation';

/**
 * Session = short-lived access token (JWT, ~1h) + long-lived refresh token.
 * The Apollo link renews the access token with the refresh token before it expires (see apollo/client.ts).
 */
export function getJwtToken(): any {
	if (typeof window !== 'undefined') {
		return localStorage.getItem('accessToken') ?? '';
	}
}

export function getRefreshToken(): string {
	if (typeof window === 'undefined') return '';
	return localStorage.getItem('refreshToken') ?? '';
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

/** stores the tokens returned by login / signup / refresh / password reset and updates the user */
export const applySession = (session: { accessToken?: string; refreshToken?: string } | null | undefined) => {
	if (!session?.accessToken) return;
	updateStorage({ jwtToken: session.accessToken });
	if (session.refreshToken) localStorage.setItem('refreshToken', session.refreshToken);
	updateUserInfo(session.accessToken);
};

export const logIn = async (nick: string, password: string): Promise<void> => {
	const apolloClient = await initializeApollo();
	try {
		const result = await apolloClient.mutate({
			mutation: LOGIN,
			variables: { input: { memberNick: nick, memberPassword: password } },
			fetchPolicy: 'network-only',
		});
		applySession(result?.data?.login);
	} catch (err: any) {
		// surface the backend message (wrong password, blocked user, too many attempts, ...)
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
 * Exchanges the refresh token for a new pair. Uses plain fetch (not Apollo) so it can run
 * inside the Apollo link chain. Returns the new access token or null when the session is over.
 */
let refreshing: Promise<string | null> | null = null;
export const refreshAccessToken = (): Promise<string | null> => {
	if (refreshing) return refreshing; // several requests at once share one refresh
	const refreshToken = getRefreshToken();
	if (!refreshToken || !process.env.REACT_APP_API_GRAPHQL_URL) return Promise.resolve(null);

	refreshing = fetch(process.env.REACT_APP_API_GRAPHQL_URL, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			query: 'mutation($t:String!){refreshSession(refreshToken:$t){accessToken refreshToken}}',
			variables: { t: refreshToken },
		}),
	})
		.then((response) => response.json())
		.then(({ data }) => {
			const session = data?.refreshSession;
			if (!session?.accessToken) {
				clearSession();
				return null;
			}
			applySession(session);
			return session.accessToken as string;
		})
		.catch(() => null)
		.finally(() => {
			refreshing = null;
		});
	return refreshing;
};

export const updateStorage = ({ jwtToken }: { jwtToken: any }) => {
	setJwtToken(jwtToken);
	window.localStorage.setItem('login', Date.now().toString());
};

export const updateUserInfo = (jwtToken: any) => {
	if (!jwtToken) return false;

	const claims = decodeJWT<CustomJwtPayload>(jwtToken);
	userVar({
		_id: claims._id ?? '',
		memberType: claims.memberType ?? '',
		memberStatus: claims.memberStatus ?? '',
		memberAuthType: claims.memberAuthType,
		memberPhone: claims.memberPhone ?? '',
		memberNick: claims.memberNick ?? '',
		memberFullName: claims.memberFullName || '',
		// empty when no photo: every avatar falls back to the default image itself
		memberImage: claims.memberImage ?? '',
		memberAddress: claims.memberAddress ?? '',
		memberDesc: claims.memberDesc ?? '',
		memberProperties: claims.memberProperties,
		memberRank: claims.memberRank,
		memberArticles: claims.memberArticles,
		memberLikes: claims.memberLikes,
		memberViews: claims.memberViews,
		memberPhoneVerified: !!claims.memberPhoneVerified,
		memberTrusted: !!claims.memberTrusted,
	});
};

/** ends the session on the server too, so the refresh token cannot be reused */
export const logOut = () => {
	const refreshToken = getRefreshToken();
	if (refreshToken && process.env.REACT_APP_API_GRAPHQL_URL) {
		fetch(process.env.REACT_APP_API_GRAPHQL_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ query: 'mutation($t:String!){logout(refreshToken:$t)}', variables: { t: refreshToken } }),
			keepalive: true,
		}).catch(() => undefined);
	}
	clearSession();
	window.location.reload();
};

export const clearSession = () => {
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	window.localStorage.setItem('logout', Date.now().toString());
	deleteUserInfo();
};

const deleteUserInfo = () => {
	userVar({
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
	});
};
