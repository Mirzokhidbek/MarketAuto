/**
 * Opens the main pages in 3 languages and reports leftovers ("undefined", "NaN", old brand names) and page errors.
 *   CHROMIUM_PATH=/path/to/chrome WEB_URL=http://localhost:3001 node e2e/ui-regression.cjs
 * Needs playwright-core and the demo data (dealer autosalon1 / 12345).
 */
const { chromium } = require('playwright-core');
const API = process.env.API_URL ?? 'http://localhost:3007/graphql';
const WEB = process.env.WEB_URL ?? 'http://localhost:3001';

async function gql(query) {
	const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }) });
	return r.json();
}

(async () => {
	const session = (await gql('mutation{login(input:{memberNick:"autosalon1",memberPassword:"12345"}){accessToken}}')).data.login;
	const carId = (await gql('{getProperties(input:{page:1,limit:1,search:{countryList:[SOUTH_KOREA]}}){list{_id}}}')).data.getProperties.list[0]._id;
	const agentId = (await gql('{getAgents(input:{page:1,limit:1,search:{}}){list{_id}}}')).data.getAgents.list[0]._id;
	const articleId = (await gql('{getBoardArticles(input:{page:1,limit:1,search:{articleCategory:NEWS}}){list{_id}}}')).data.getBoardArticles.list[0]._id;

	const pages = [
		'/', '/property', `/property/detail?id=${carId}`, '/agent', `/agent/detail?agentId=${agentId}`,
		`/member?memberId=${agentId}&category=properties`, '/community?articleCategory=NEWS',
		`/community/detail?articleCategory=NEWS&id=${articleId}`, '/cs?tab=faq', '/about', '/account/join',
		'/mypage?category=myProfile', '/mypage?category=myProperties', '/mypage?category=addProperty',
	];
	const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? process.argv[2] });
	const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
	const problems = [];
	page.on('pageerror', (e) => problems.push(`[${page.url()}] pageerror: ${e.message.slice(0, 140)}`));
	page.on('console', (m) => {
		const x = m.text();
		if (/did not match|Hydration|Warning: Each child|Cannot read/i.test(x)) problems.push(`[${page.url()}] console: ${x.slice(0, 140)}`);
	});
	await page.goto(`${WEB}/`, { waitUntil: 'load', timeout: 120000 });
	// the refresh token is an httpOnly cookie of the API; the access token alone is enough for this run
	await page.evaluate((t) => localStorage.setItem('accessToken', t.accessToken), session);

	for (const locale of ['', '/uz', '/ru']) {
		for (const path of pages) {
			await page.goto(`${WEB}${locale}${path}`, { waitUntil: 'load', timeout: 120000 });
			await page.waitForTimeout(2500);
			const body = await page.innerText('body');
			const leftovers = ['Nestar', 'NESTAR', 'MOBILE', 'Property', 'undefined', 'NaN'].filter((w) => body.includes(w));
			const ok = !leftovers.length;
			console.log(`${(locale || '/en').padEnd(4)} ${path.slice(0, 48).padEnd(48)} ${ok ? 'OK' : 'CHECK: ' + leftovers.join(',')}`);
		}
	}
	console.log('\nproblems:', problems.length ? '\n' + [...new Set(problems)].join('\n') : 'none');
	await browser.close();
	process.exit(problems.length ? 1 : 0);
})();
