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

/** moves `refreshToken` from a login/signup/refresh result into the cookie and removes it from the body */
@Injectable()
export class SessionCookieInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const res = GqlExecutionContext.create(context).getContext()?.res;
		return next.handle().pipe(
			map((result: { refreshToken?: unknown } | null | undefined): unknown => {
				if (result && typeof result.refreshToken === 'string') {
					setRefreshCookie(res, result.refreshToken);
					result.refreshToken = null;
				}
				return result;
			}),
		);
	}
}
