import { NextRequest, NextResponse } from 'next/server';

/**
 * robots.txt and sitemap.xml are built per request (site address, active cars) by API routes.
 * A rewrite in next.config does not reach them with i18n on (the locale handling claims the path first).
 */
export function middleware(request: NextRequest) {
	const target = request.nextUrl.pathname === '/robots.txt' ? '/api/robots' : '/api/sitemap';
	return NextResponse.rewrite(new URL(target, request.url));
}

export const config = { matcher: ['/robots.txt', '/sitemap.xml'] };
