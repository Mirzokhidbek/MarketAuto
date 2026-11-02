// Finds real, freely licensed car photos on Wikimedia Commons for every model in the seed catalog and
// writes their links (plus author and license, which CC licenses require) to seed/photos.json.
// Run from the repo root: node seed/fetch-photos.mjs   (only reads the public Commons API)
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'CarPortSeed/1.0 (local development seed data)' };
const PER_MODEL = 6;
const WIDTH = 1280;

// search phrase per model; Commons titles use the international names
const MODELS = {
	'CHEVROLET|Cobalt': 'Chevrolet Cobalt 2013',
	'CHEVROLET|Gentra': 'Chevrolet Lacetti sedan',
	'CHEVROLET|Nexia 3': 'Chevrolet Aveo T300 sedan',
	'CHEVROLET|Malibu 2': 'Chevrolet Malibu 2019',
	'CHEVROLET|Tracker 2': 'Chevrolet Tracker 2020',
	'CHEVROLET|Onix': 'Chevrolet Onix sedan',
	'CHEVROLET|Captiva': 'Chevrolet Captiva 2019',
	'CHEVROLET|Spark': 'Chevrolet Spark',
	'CHEVROLET|Damas': 'Daewoo Damas',
	'CHEVROLET|Equinox': 'Chevrolet Equinox 2018',
	'KIA|K5': 'Kia K5 2020',
	'KIA|Sportage': 'Kia Sportage 2022',
	'KIA|Sorento': 'Kia Sorento 2021',
	'KIA|Seltos': 'Kia Seltos',
	'HYUNDAI|Sonata': 'Hyundai Sonata 2020',
	'HYUNDAI|Tucson': 'Hyundai Tucson 2021',
	'HYUNDAI|Elantra': 'Hyundai Elantra 2021',
	'HYUNDAI|Santa Fe': 'Hyundai Santa Fe 2021',
	'TOYOTA|Camry 70': 'Toyota Camry XV70',
	'TOYOTA|RAV4': 'Toyota RAV4 2019',
	'TOYOTA|Land Cruiser 300': 'Toyota Land Cruiser 300',
	'TOYOTA|Corolla': 'Toyota Corolla E210 sedan',
	'BYD|Song Plus': 'BYD Song Plus',
	'BYD|Han': 'BYD Han',
	'BYD|Chazor': 'BYD Chazor',
	'BYD|Seagull': 'BYD Seagull',
	'CHERY|Tiggo 7 Pro': 'Chery Tiggo 7 Pro',
	'CHERY|Arrizo 8': 'Chery Arrizo 8',
	'HAVAL|Jolion': 'Haval Jolion',
	'HAVAL|H6': 'Haval H6 2021',
	'LADA|Vesta': 'Lada Vesta',
	'LADA|Granta': 'Lada Granta',
	'LADA|Niva Travel': 'Lada Niva Travel',
	'NISSAN|X-Trail': 'Nissan X-Trail T32',
	'HONDA|CR-V': 'Honda CR-V 2023',
	'HONDA|Accord': 'Honda Accord 2018',
	'VOLKSWAGEN|Passat': 'Volkswagen Passat B8',
	'VOLKSWAGEN|ID.4': 'Volkswagen ID.4',
	'MERCEDES_BENZ|E-Class': 'Mercedes-Benz W213',
	'MERCEDES_BENZ|GLE': 'Mercedes-Benz GLE V167',
	'BMW|X5': 'BMW X5 G05',
	'BMW|5 Series': 'BMW G30',
	'AUDI|A6': 'Audi A6 C8',
	'AUDI|Q7': 'Audi Q7 2020',
	'LEXUS|LX 600': 'Lexus LX 600',
	'LEXUS|RX 350': 'Lexus RX 350 2023',
};

// close-ups, interiors, engines, badges, crash/race shots and such are not listing photos
const SKIP = /interior|innenraum|cockpit|dashboard|engine|motor|badge|logo|emblem|wheel|rim|detail|trunk|seat|steering|light|lamp|grille|crash|race|rally|police|taxi|polizei|model|toy|miniature|diagram|svg/i;

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const search = async (phrase) => {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		generator: 'search',
		gsrsearch: `filetype:bitmap ${phrase}`,
		gsrnamespace: '6',
		gsrlimit: '40',
		prop: 'imageinfo',
		iiprop: 'url|size|mime|extmetadata',
		iiextmetadatafilter: 'LicenseShortName|Artist|License',
		iiurlwidth: String(WIDTH),
	});
	let res;
	for (let attempt = 1; ; attempt++) {
		res = await fetch(`${API}?${params}`, { headers: HEADERS });
		// rate limited: wait as asked (or back off) and try again
		if (res.status !== 429 || attempt === 6) break;
		const wait = Number(res.headers.get('retry-after')) || 5 * attempt;
		console.log(`  rate limited, waiting ${wait}s`);
		await new Promise((r) => setTimeout(r, wait * 1000));
	}
	if (!res.ok) throw new Error(`${phrase}: HTTP ${res.status}`);
	const pages = Object.values((await res.json()).query?.pages ?? {}).sort((a, b) => a.index - b.index);
	const words = phrase.toLowerCase().split(' ').slice(0, 2);
	return pages
		.map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
		.filter(({ title, info }) => {
			if (!info || info.mime !== 'image/jpeg') return false;
			const meta = info.extmetadata ?? {};
			const license = meta.LicenseShortName?.value ?? '';
			// only licenses that allow reuse with attribution
			if (!/^(CC0|CC BY|CC-BY|Public domain|PD)/i.test(license)) return false;
			// landscape and large enough for a listing photo
			if (info.width < 1000 || info.width / info.height < 1.2 || info.width / info.height > 2.2) return false;
			const name = title.toLowerCase();
			return words.every((w) => name.includes(w)) && !SKIP.test(title);
		})
		.slice(0, PER_MODEL)
		.map(({ title, info }) => ({
			url: info.thumburl ?? info.url,
			page: info.descriptionurl,
			title: title.replace(/^File:/, ''),
			author: strip(info.extmetadata?.Artist?.value) || 'unknown',
			license: info.extmetadata?.LicenseShortName?.value,
		}));
};

const photos = {};
for (const [key, phrase] of Object.entries(MODELS)) {
	photos[key] = await search(phrase);
	// fewer than 3 hits: try the brand + model alone
	if (photos[key].length < 3) {
		const [brand, model] = key.split('|');
		const extra = await search(`${brand === 'MERCEDES_BENZ' ? 'Mercedes-Benz' : brand.charAt(0) + brand.slice(1).toLowerCase()} ${model}`);
		const seen = new Set(photos[key].map((p) => p.url));
		photos[key].push(...extra.filter((p) => !seen.has(p.url)).slice(0, PER_MODEL - photos[key].length));
	}
	console.log(`${key.padEnd(28)} ${photos[key].length}`);
	await new Promise((r) => setTimeout(r, 1500)); // be gentle with the public API
}

// article covers: general road / dealership scenes
photos._articles = [];
for (const phrase of ['Tashkent traffic', 'car dealership', 'used car market', 'car wash', 'winter tire', 'electric car charging', 'car inspection', 'Chevrolet Tashkent']) {
	const hit = (await search(phrase).catch(() => [])).find((p) => !photos._articles.some((a) => a.url === p.url));
	if (hit) photos._articles.push({ ...hit, phrase });
	await new Promise((r) => setTimeout(r, 1500));
}

await writeFile(path.join(ROOT, 'photos.json'), JSON.stringify(photos, null, '\t') + '\n');
const short = Object.entries(photos).filter(([k, v]) => !k.startsWith('_') && v.length < 3);
console.log('models with fewer than 3 photos:', short.map(([k, v]) => `${k}=${v.length}`).join(', ') || 'none');
console.log('article covers:', photos._articles.length);
