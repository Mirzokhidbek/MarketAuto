import { settings } from './env';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { map, Observable } from 'rxjs';

/**
 * The refresh token lives only in an httpOnly cookie: page scripts (and so an XSS) cannot read it.
 * The short-lived access token is still returned in the response body.
 */
export const REFRESH_COOKIE = 'ma_refresh';

const cookieOptions = () => {
	const sameSite = settings.cookieSameSite;
	return {
		httpOnly: true,
		// SameSite=None is only accepted by browsers together with Secure
		secure: settings.production || sameSite === 'none',
		sameSite,
		path: '/graphql',
	};
};

export const setRefreshCookie = (res: any, token: string): void => {
	const days = settings.refreshTokenDays;
	res?.cookie?.(REFRESH_COOKIE, token, { ...cookieOptions(), maxAge: days * 24 * 60 * 60 * 1000 });
};

export const clearRefreshCookie = (res: any): void => {
	res?.clearCookie?.(REFRESH_COOKIE, cookieOptions());
};

export const readCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
	for (const part of (cookieHeader ?? '').split(';')) {
		const index = part.indexOf('=');
		if (index < 0 || part.slice(0, index).trim() !== name) continue;
		try {
			return decodeURIComponent(part.slice(index + 1).trim());
		} catch {
			return undefined;
		}
	}
	return undefined;
};

export const readRefreshCookie = (req: any): string | undefined => readCookie(req?.headers?.cookie, REFRESH_COOKIE);

/**
 * Native mobile apps send `X-Client: mobile`. They have no browser cookie jar and keep the refresh token in the
 * device keychain, so for them it stays in the response body and is read from the request (argument or the
 * `X-Refresh-Token` header) — never from a cookie. Browsers always use the httpOnly cookie.
 */
export const isNativeClient = (req: any): boolean =>
	String(req?.headers?.['x-client'] ?? '').toLowerCase() === 'mobile';

/** the caller's refresh token: the cookie for browsers, the header for native apps */
export const currentRefreshToken = (req: any): string | undefined =>
	isNativeClient(req) ? String(req?.headers?.['x-refresh-token'] ?? '') || undefined : readRefreshCookie(req);

/** moves `refreshToken` from a login/signup/refresh result into the cookie and removes it from the body */
@Injectable()
export class SessionCookieInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const { req, res } = GqlExecutionContext.create(context).getContext() ?? {};
		const native = isNativeClient(req);
		return next.handle().pipe(
			map((result: { refreshToken?: unknown } | null | undefined): unknown => {
				if (!native && result && typeof result.refreshToken === 'string') {
					setRefreshCookie(res, result.refreshToken);
					result.refreshToken = null;
				}
				return result;
			}),
		);
	}
}
