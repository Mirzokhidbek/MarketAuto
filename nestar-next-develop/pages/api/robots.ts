import type { NextApiRequest, NextApiResponse } from 'next';
import { siteUrlFrom } from '../../libs/siteUrl';

/** /robots.txt (rewritten here): private and admin pages are not crawled; the sitemap lists the rest */
export default function robots(req: NextApiRequest, res: NextApiResponse) {
	const site = siteUrlFrom(req);
	// prefixes without a trailing slash, so /_admin itself is covered too
	const privatePaths = ['/_admin', '/admin', '/mypage', '/account', '/compare', '/api'];
	const lines = [
		'User-agent: *',
		...['', '/ru', '/en'].flatMap((prefix) => privatePaths.map((path) => `Disallow: ${prefix}${path}`)),
		'Allow: /',
		'',
		`Sitemap: ${site}/sitemap.xml`,
	];
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	res.setHeader('Cache-Control', 'public, max-age=3600');
	res.status(200).send(lines.join('\n'));
}
