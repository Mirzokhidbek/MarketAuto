/**
 * Load test for a running API: how many requests per second each public operation answers and how long
 * they take (p50 / p95 / p99) with many visitors at once. Read-only: it creates nothing.
 *
 *   API_URL=http://localhost:3007/graphql CONCURRENCY=20 SECONDS=10 node e2e/load-test.mjs
 *
 * Run it against a staging copy, not the live site, and from another machine than the API for real
 * numbers. In production the per-IP limits do not cover these read queries, so nothing is blocked.
 */
const API = process.env.API_URL ?? 'http://localhost:3007/graphql';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 20);
const SECONDS = Number(process.env.SECONDS ?? 10);

const post = async (query, variables) => {
	const response = await fetch(API, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query, variables }),
	});
	const json = await response.json();
	if (!response.ok || json.errors) throw new Error(json.errors?.[0]?.message ?? `HTTP ${response.status}`);
	return json.data;
};

const LIST = `query getProperties($i: PropertiesInquiry!) { getProperties(input: $i) { list { _id propertyTitle propertyPrice
	carBrand carModel carYear carMileage propertyImages memberData { memberNick memberImage } } metaCounter { total } } }`;
const list = (sort, direction, search = {}) => () =>
	post(LIST, { i: { page: 1, limit: 9, sort, direction, search } });

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0;

/** CONCURRENCY virtual visitors call `run` back to back for SECONDS seconds */
const measure = async (name, run) => {
	const times = [];
	let errors = 0;
	let lastError = '';
	const until = Date.now() + SECONDS * 1000;
	const visitor = async () => {
		while (Date.now() < until) {
			const started = performance.now();
			try {
				await run();
				times.push(performance.now() - started);
			} catch (error) {
				errors++;
				lastError = error.message;
			}
		}
	};
	await Promise.all(Array.from({ length: CONCURRENCY }, visitor));
	times.sort((a, b) => a - b);
	const row = {
		operation: name,
		'req/s': Math.round(times.length / SECONDS),
		p50: `${percentile(times, 50).toFixed(0)}ms`,
		p95: `${percentile(times, 95).toFixed(0)}ms`,
		p99: `${percentile(times, 99).toFixed(0)}ms`,
		errors,
	};
	if (errors) row.lastError = lastError.slice(0, 60);
	return row;
};

const main = async () => {
	const first = await post(LIST, { i: { page: 1, limit: 1, search: {} } });
	const carId = first.getProperties?.list?.[0]?._id;
	console.log(`${API}: ${CONCURRENCY} visitors at once, ${SECONDS}s per operation, ${first.getProperties?.metaCounter?.[0]?.total ?? 0} active cars\n`);

	const scenarios = [
		['getProperties newest', list('createdAt', 'DESC')],
		['getProperties cheapest', list('propertyPrice', 'ASC')],
		['getProperties brand filter', list('createdAt', 'DESC', { brandList: ['CHEVROLET', 'KIA'] })],
		['getProperties text search', list('createdAt', 'DESC', { text: 'cobalt' })],
		['getSiteSettings (cached)', () => post('{ getSiteSettings { supportPhone supportEmail } }')],
		['getCarModels (cached)', () => post('{ getCarModels(brand: CHEVROLET) }')],
		['getExchangeRate', () => post('{ getExchangeRate { usdToUzs } }')],
	];
	if (carId) {
		scenarios.push(['getProperty', () => post(`{ getProperty(propertyId: "${carId}") { _id propertyTitle propertyPrice } }`)]);
		scenarios.push(['getImportCost', () => post(`{ getImportCost(propertyId: "${carId}") { totalUsd } }`)]);
	}

	const rows = [];
	for (const [name, run] of scenarios) rows.push(await measure(name, run));
	console.table(rows);
	if (rows.some((row) => row.errors)) process.exitCode = 1;
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
