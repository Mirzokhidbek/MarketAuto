import type { NextApiRequest, NextApiResponse } from 'next';
import { siteUrlFrom } from '../../libs/siteUrl';

const LOCALES = ['uz', 'ru', 'en'] as const;
// Uzbek is the default language: its addresses have no prefix
// (no trailing slash: that is the canonical form, "/about/" redirects to "/about")
const localized = (site: string, locale: string, path: string) => {
	const prefix = locale === 'uz' ? '' : `/${locale}`;
	return `${site}${path === '/' ? prefix || '/' : `${prefix}${path}`}`;
};
const STATIC_PAGES = ['/', '/property', '/agent', '/community', '/about', '/cs', '/terms', '/privacy', '/offer'];
const PAGE_SIZE = 100;
const MAX_CARS = 5000;

const escapeXml = (text: string) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** active cars from the API (newest first), up to MAX_CARS */
const loadCars = async (): Promise<{ _id: string; updatedAt?: string }[]> => {
	const url = process.env.API_INTERNAL_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL;
	if (!url) return [];
	const cars: { _id: string; updatedAt?: string }[] = [];
	for (let page = 1; cars.length < MAX_CARS; page++) {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				query: 'query($i:PropertiesInquiry!){getProperties(input:$i){list{_id updatedAt} metaCounter{total}}}',
				variables: { i: { page, limit: PAGE_SIZE, sort: 'createdAt', direction: 'DESC', search: {} } },
			}),
			signal: AbortSignal.timeout(5000),
		});
		const data = (await response.json())?.data?.getProperties;
		const list = data?.list ?? [];
		cars.push(...list);
		if (list.length < PAGE_SIZE || cars.length >= (data?.metaCounter?.[0]?.total ?? 0)) break;
	}
	return cars;
};

/** /sitemap.xml (rewritten here): public pages and every active car, in all three languages */
export default async function sitemap(req: NextApiRequest, res: NextApiResponse) {
	const site = siteUrlFrom(req);
	let cars: { _id: string; updatedAt?: string }[] = [];
	try {
		cars = await loadCars();
	} catch {
		// the static pages are still worth listing when the API is down
	}
	const entry = (path: string, lastmod?: string) =>
		LOCALES.map(
			(locale) =>
				`<url><loc>${escapeXml(localized(site, locale, path))}</loc>` +
				(lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : '') +
				LOCALES.map(
					(alt) => `<xhtml:link rel="alternate" hreflang="${alt}" href="${escapeXml(localized(site, alt, path))}"/>`,
				).join('') +
				`</url>`,
		).join('');
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		STATIC_PAGES.map((path) => entry(path)).join('') +
		cars.map((car) => entry(`/property/detail?id=${car._id}`, car.updatedAt)).join('') +
		'</urlset>';
	res.setHeader('Content-Type', 'application/xml; charset=utf-8');
	res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
	res.status(200).send(body);
}
