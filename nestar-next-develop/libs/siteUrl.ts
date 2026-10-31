import type { IncomingMessage } from 'http';
import { SITE_URL } from './config';

/** public address of the site: NEXT_PUBLIC_SITE_URL, or the address the request came in on */
export const siteUrlFrom = (req: IncomingMessage): string => {
	if (SITE_URL) return SITE_URL;
	const proto = String(req.headers['x-forwarded-proto'] ?? 'http').split(',')[0];
	return `${proto}://${req.headers['x-forwarded-host'] ?? req.headers.host}`;
};
