// Builds seed/data.json (members, cars, articles) and the pictures they point to in seed/uploads/.
// Run from the repo root: node seed/generate.mjs
// The same seed always gives the same data, so the file can be regenerated without surprises.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(ROOT, 'uploads');
// test password of every seeded account (see seed/README.md)
const PASSWORD = 'carport123';

/* ---------- deterministic random ---------- */
let state = 20261031;
const rand = () => ((state = (state * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (list) => list[Math.floor(rand() * list.length)];
const chance = (p) => rand() < p;
const oid = (label) => createHash('md5').update(label).digest('hex').slice(0, 24);
const uuid = (label) => {
	const h = createHash('sha1').update(label).digest('hex');
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};
const NOW = new Date('2026-10-31T09:00:00Z').getTime();
const daysAgo = (days) => new Date(NOW - days * 86400000 - int(0, 86399) * 1000);
// MongoDB Extended JSON, so EJSON.parse / mongoimport keep ObjectId and Date types
const $oid = (id) => ({ $oid: id });
const $date = (date) => ({ $date: date.toISOString() });

/* ---------- catalog ---------- */
// [brand, model, body, fuel, transmission, engine, price range USD (new-ish), country of make]
const CATALOG = [
	['CHEVROLET', 'Cobalt', 'SEDAN', 'PETROL', 'AUTOMATIC', 1.5, [9500, 14000]],
	['CHEVROLET', 'Gentra', 'SEDAN', 'PETROL', 'AUTOMATIC', 1.5, [9000, 13500]],
	['CHEVROLET', 'Nexia 3', 'SEDAN', 'GAS', 'MANUAL', 1.5, [6500, 9500]],
	['CHEVROLET', 'Malibu 2', 'SEDAN', 'PETROL', 'AUTOMATIC', 1.5, [21000, 30000]],
	['CHEVROLET', 'Tracker 2', 'SUV', 'PETROL', 'AUTOMATIC', 1.2, [16000, 21000]],
	['CHEVROLET', 'Onix', 'SEDAN', 'PETROL', 'AUTOMATIC', 1.2, [12000, 16000]],
	['CHEVROLET', 'Captiva', 'SUV', 'PETROL', 'AUTOMATIC', 1.5, [22000, 28000]],
	['CHEVROLET', 'Spark', 'HATCHBACK', 'PETROL', 'MANUAL', 1.25, [5500, 9000]],
	['CHEVROLET', 'Damas', 'MINIVAN', 'GAS', 'MANUAL', 0.8, [4500, 7500]],
	['CHEVROLET', 'Equinox', 'SUV', 'PETROL', 'AUTOMATIC', 1.5, [26000, 34000]],
	['KIA', 'K5', 'SEDAN', 'PETROL', 'AUTOMATIC', 2.0, [22000, 30000]],
	['KIA', 'Sportage', 'SUV', 'PETROL', 'AUTOMATIC', 2.0, [24000, 33000]],
	['KIA', 'Sorento', 'SUV', 'DIESEL', 'AUTOMATIC', 2.2, [30000, 42000]],
	['KIA', 'Seltos', 'SUV', 'PETROL', 'CVT', 1.6, [18000, 24000]],
	['HYUNDAI', 'Sonata', 'SEDAN', 'PETROL', 'AUTOMATIC', 2.0, [20000, 29000]],
	['HYUNDAI', 'Tucson', 'SUV', 'PETROL', 'AUTOMATIC', 2.0, [24000, 32000]],
	['HYUNDAI', 'Elantra', 'SEDAN', 'PETROL', 'CVT', 1.6, [16000, 22000]],
	['HYUNDAI', 'Santa Fe', 'SUV', 'DIESEL', 'AUTOMATIC', 2.2, [32000, 43000]],
	['TOYOTA', 'Camry 70', 'SEDAN', 'PETROL', 'AUTOMATIC', 2.5, [26000, 36000]],
	['TOYOTA', 'RAV4', 'SUV', 'HYBRID', 'CVT', 2.5, [29000, 38000]],
	['TOYOTA', 'Land Cruiser 300', 'SUV', 'DIESEL', 'AUTOMATIC', 3.3, [85000, 115000]],
	['TOYOTA', 'Corolla', 'SEDAN', 'HYBRID', 'CVT', 1.8, [18000, 25000]],
	['BYD', 'Song Plus', 'SUV', 'HYBRID', 'ROBOT', 1.5, [26000, 33000]],
	['BYD', 'Han', 'SEDAN', 'ELECTRIC', 'AUTOMATIC', null, [32000, 40000]],
	['BYD', 'Chazor', 'SEDAN', 'HYBRID', 'ROBOT', 1.5, [21000, 26000]],
	['BYD', 'Seagull', 'HATCHBACK', 'ELECTRIC', 'AUTOMATIC', null, [11000, 14500]],
	['CHERY', 'Tiggo 7 Pro', 'SUV', 'PETROL', 'CVT', 1.5, [18000, 23000]],
	['CHERY', 'Arrizo 8', 'SEDAN', 'PETROL', 'ROBOT', 1.6, [19000, 24000]],
	['HAVAL', 'Jolion', 'SUV', 'PETROL', 'ROBOT', 1.5, [17000, 22000]],
	['HAVAL', 'H6', 'SUV', 'PETROL', 'ROBOT', 2.0, [23000, 29000]],
	['LADA', 'Vesta', 'SEDAN', 'PETROL', 'MANUAL', 1.6, [9000, 13000]],
	['LADA', 'Granta', 'SEDAN', 'PETROL', 'MANUAL', 1.6, [7000, 9500]],
	['LADA', 'Niva Travel', 'SUV', 'PETROL', 'MANUAL', 1.7, [11000, 14500]],
	['NISSAN', 'X-Trail', 'SUV', 'PETROL', 'CVT', 2.5, [22000, 30000]],
	['HONDA', 'CR-V', 'SUV', 'HYBRID', 'CVT', 2.0, [27000, 35000]],
	['HONDA', 'Accord', 'SEDAN', 'PETROL', 'CVT', 1.5, [23000, 30000]],
	['VOLKSWAGEN', 'Passat', 'SEDAN', 'PETROL', 'ROBOT', 1.8, [17000, 25000]],
	['VOLKSWAGEN', 'ID.4', 'SUV', 'ELECTRIC', 'AUTOMATIC', null, [24000, 32000]],
	['MERCEDES_BENZ', 'E-Class', 'SEDAN', 'PETROL', 'AUTOMATIC', 2.0, [45000, 65000]],
	['MERCEDES_BENZ', 'GLE', 'SUV', 'DIESEL', 'AUTOMATIC', 3.0, [62000, 85000]],
	['BMW', 'X5', 'SUV', 'PETROL', 'AUTOMATIC', 3.0, [55000, 80000]],
	['BMW', '5 Series', 'SEDAN', 'PETROL', 'AUTOMATIC', 2.0, [42000, 60000]],
	['AUDI', 'A6', 'SEDAN', 'PETROL', 'ROBOT', 2.0, [38000, 52000]],
	['AUDI', 'Q7', 'SUV', 'DIESEL', 'AUTOMATIC', 3.0, [52000, 72000]],
	['LEXUS', 'LX 600', 'SUV', 'PETROL', 'AUTOMATIC', 3.4, [110000, 145000]],
	['LEXUS', 'RX 350', 'SUV', 'PETROL', 'AUTOMATIC', 2.4, [52000, 68000]],
];
const BRAND_LABEL = { MERCEDES_BENZ: 'Mercedes-Benz', BMW: 'BMW', BYD: 'BYD', KIA: 'Kia', LADA: 'Lada' };
const brandLabel = (b) => BRAND_LABEL[b] ?? b.charAt(0) + b.slice(1).toLowerCase();

// [name shown in the listing, hex used for the picture]
const COLORS = [
	['Oq', '#f2f3f5'],
	['Qora', '#1d1f24'],
	['Kumush', '#b9bec6'],
	['Kulrang', '#6b7079'],
	['Ko‘k', '#2456b8'],
	['Qizil', '#b3262d'],
	['Jigarrang', '#6b4a32'],
	['Yashil', '#2f6b48'],
	['Bej', '#d8c7a6'],
];
const CITIES = {
	TASHKENT: ['Toshkent, Chilonzor tumani', 'Toshkent, Yunusobod tumani', 'Toshkent, Mirzo Ulug‘bek tumani', 'Toshkent, Sergeli avtobozori'],
	TASHKENT_REGION: ['Toshkent viloyati, Chirchiq', 'Toshkent viloyati, Olmaliq'],
	SAMARKAND: ['Samarqand, Registon ko‘chasi', 'Samarqand avtobozori'],
	BUKHARA: ['Buxoro, Navoiy shoh ko‘chasi'],
	ANDIJAN: ['Andijon, Bobur shoh ko‘chasi', 'Andijon avtobozori'],
	NAMANGAN: ['Namangan, Davlatobod tumani'],
	FERGANA: ['Farg‘ona, Al-Farg‘oniy ko‘chasi', 'Qo‘qon shahri'],
	NAVOI: ['Navoiy, Xalqlar do‘stligi ko‘chasi'],
	KARSHI: ['Qarshi, Nasaf ko‘chasi'],
	TERMEZ: ['Termiz, At-Termiziy ko‘chasi'],
	JIZZAKH: ['Jizzax, Sharof Rashidov ko‘chasi'],
	GULISTAN: ['Guliston shahri'],
	URGENCH: ['Urganch, Al-Xorazmiy ko‘chasi'],
	NUKUS: ['Nukus, Doslik guzari'],
};
const ABROAD = {
	SOUTH_KOREA: ['Seul, Janubiy Koreya', 'Inchon porti, Janubiy Koreya'],
	CHINA: ['Urumchi, Xitoy', 'Guanchjou, Xitoy'],
	JAPAN: ['Yokogama, Yaponiya'],
	USA: ['Nyu-Jersi, AQSh', 'Kaliforniya, AQSh'],
	GERMANY: ['Myunxen, Germaniya', 'Berlin, Germaniya'],
	UAE: ['Dubay, BAA'],
};
const ABROAD_BRANDS = {
	SOUTH_KOREA: ['KIA', 'HYUNDAI'],
	CHINA: ['BYD', 'CHERY', 'HAVAL'],
	JAPAN: ['TOYOTA', 'NISSAN', 'HONDA', 'LEXUS'],
	USA: ['CHEVROLET', 'TOYOTA', 'HONDA', 'BMW'],
	GERMANY: ['MERCEDES_BENZ', 'BMW', 'AUDI', 'VOLKSWAGEN'],
	UAE: ['LEXUS', 'TOYOTA', 'MERCEDES_BENZ'],
};
const DELIVERY = { SOUTH_KOREA: [25, 2200], CHINA: [12, 1500], JAPAN: [35, 2600], USA: [55, 3400], GERMANY: [20, 2400], UAE: [18, 1900] };

/* ---------- pictures ---------- */
const BODY_PATH = {
	SEDAN: 'M90 300 L150 300 L210 230 Q240 200 300 196 L520 196 Q580 200 630 240 L700 270 Q760 280 770 310 L770 350 L90 350 Z',
	SUV: 'M90 290 L130 290 L190 205 Q210 180 260 178 L560 178 Q600 180 640 230 L700 262 Q760 274 770 305 L770 360 L90 360 Z',
	HATCHBACK: 'M100 300 L150 300 L210 225 Q240 196 300 194 L560 194 Q620 200 660 270 L730 285 Q765 292 765 320 L765 355 L100 355 Z',
	MINIVAN: 'M100 360 L100 210 Q104 170 150 166 L600 166 Q650 170 690 240 L750 270 Q770 280 770 310 L770 360 Z',
	PICKUP: 'M90 300 L200 300 L250 215 Q270 192 320 192 L460 192 L470 280 L770 280 L770 360 L90 360 Z',
	COUPE: 'M90 305 L170 305 L260 235 Q300 210 360 208 L500 208 Q570 214 630 255 L720 280 Q765 290 770 318 L770 350 L90 350 Z',
	WAGON: 'M90 300 L150 300 L210 225 Q235 196 300 194 L640 194 Q680 198 700 250 L740 275 Q770 284 770 312 L770 352 L90 352 Z',
	CONVERTIBLE: 'M90 305 L200 305 L280 262 L520 262 Q600 266 660 285 L730 292 Q768 298 770 320 L770 350 L90 350 Z',
};
const WINDOW_PATH = {
	SEDAN: 'M230 296 L285 222 Q300 210 330 208 L420 208 L420 296 Z M440 208 L515 208 Q560 212 605 250 L640 296 L440 296 Z',
	SUV: 'M210 286 L265 200 Q280 190 300 190 L410 190 L410 286 Z M430 190 L550 190 Q585 192 615 238 L650 286 L430 286 Z',
	HATCHBACK: 'M225 296 L280 220 Q296 207 325 206 L420 206 L420 296 Z M440 206 L555 206 Q600 212 630 266 L640 296 L440 296 Z',
	MINIVAN: 'M130 270 L130 205 Q132 186 160 184 L350 184 L350 270 Z M370 184 L590 184 Q630 188 660 250 L668 270 L370 270 Z',
	PICKUP: 'M270 290 L300 222 Q312 206 340 206 L445 206 L450 290 Z',
	COUPE: 'M290 300 L330 240 Q350 222 380 222 L480 222 Q540 228 590 262 L610 300 Z',
	WAGON: 'M225 296 L280 220 Q296 207 325 206 L440 206 L440 296 Z M460 206 L630 206 Q665 210 680 262 L686 296 L460 296 Z',
	CONVERTIBLE: 'M300 300 L330 270 L470 270 L490 300 Z',
};
const SHOTS = [
	{ sky: ['#dbe7f5', '#f6f8fb'], ground: '#c9ced6', flip: false, label: 'old tomondan' },
	{ sky: ['#f4e3cf', '#fbf6ef'], ground: '#cdbfae', flip: true, label: 'orqa tomondan' },
	{ sky: ['#dde3ea', '#eef1f4'], ground: '#9aa1ab', flip: false, label: 'salon' },
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const carSvg = (car, colorHex, shot, idx) => {
	const body = BODY_PATH[car.propertyType];
	const windows = WINDOW_PATH[car.propertyType];
	const flip = shot.flip ? 'transform="translate(860 0) scale(-1 1)"' : '';
	const interior =
		idx === 2
			? `<rect x="0" y="0" width="860" height="540" fill="#2b2e33"/>
		<circle cx="300" cy="300" r="120" fill="none" stroke="#585d66" stroke-width="26"/>
		<circle cx="300" cy="300" r="24" fill="#585d66"/>
		<rect x="470" y="200" width="300" height="170" rx="18" fill="#15171a" stroke="#4b5059" stroke-width="6"/>
		<rect x="490" y="220" width="260" height="130" rx="10" fill="${colorHex}" opacity="0.35"/>
		<rect x="0" y="430" width="860" height="110" fill="#1f2125"/>`
			: '';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="860" height="540" viewBox="0 0 860 540">
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shot.sky[0]}"/><stop offset="1" stop-color="${shot.sky[1]}"/></linearGradient>
		<linearGradient id="paint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colorHex}"/><stop offset="1" stop-color="${colorHex}" stop-opacity="0.82"/></linearGradient>
	</defs>
	<rect width="860" height="540" fill="url(#sky)"/>
	<rect y="380" width="860" height="160" fill="${shot.ground}"/>
	${
		interior ||
		`<g ${flip}>
		<ellipse cx="430" cy="372" rx="370" ry="22" fill="#000" opacity="0.18"/>
		<path d="${body}" fill="url(#paint)" stroke="#0f1115" stroke-opacity="0.35" stroke-width="3"/>
		<path d="${windows}" fill="#26303d" opacity="0.88"/>
		<rect x="740" y="296" width="26" height="12" rx="4" fill="#ffd27a"/>
		<rect x="94" y="300" width="20" height="12" rx="4" fill="#d6453d"/>
		<circle cx="235" cy="355" r="52" fill="#16181c"/><circle cx="235" cy="355" r="26" fill="#9ca3ad"/>
		<circle cx="640" cy="355" r="52" fill="#16181c"/><circle cx="640" cy="355" r="26" fill="#9ca3ad"/>
	</g>`
	}
	<text x="430" y="70" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="${idx === 2 ? '#ffffff' : '#1d1f24'}">${esc(brandLabel(car.carBrand))} ${esc(car.carModel)}</text>
	<text x="430" y="112" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${idx === 2 ? '#c5c9d0' : '#4a4f57'}">${car.carYear} · ${esc(car.carColor)} · ${shot.label}</text>
	<text x="430" y="510" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="${idx === 2 ? '#8a9099' : '#5b616b'}">CarPort</text>
</svg>`;
};

const avatarSvg = (initials, hue) => `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
	<rect width="320" height="320" fill="hsl(${hue} 55% 46%)"/>
	<circle cx="160" cy="128" r="62" fill="hsl(${hue} 60% 78%)"/>
	<path d="M48 320 Q60 210 160 210 Q260 210 272 320 Z" fill="hsl(${hue} 60% 78%)"/>
	<text x="160" y="148" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="56" font-weight="700" fill="hsl(${hue} 55% 30%)">${esc(initials)}</text>
</svg>`;

const articleSvg = (title, hue) => `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
	<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 60% 40%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 22%)"/></linearGradient></defs>
	<rect width="960" height="540" fill="url(#g)"/>
	<circle cx="800" cy="120" r="180" fill="#fff" opacity="0.07"/>
	<circle cx="140" cy="470" r="140" fill="#fff" opacity="0.06"/>
	<text x="60" y="440" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${esc(title.length > 34 ? title.slice(0, 33) + '…' : title)}</text>
	<text x="60" y="490" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.75">CarPort jamiyati</text>
</svg>`;

const saveWebp = async (svg, relPath) => {
	await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(path.join(ROOT, relPath));
	return relPath;
};

/* ---------- members ---------- */
const FIRST = ['Aziz', 'Jasur', 'Sardor', 'Bekzod', 'Dilshod', 'Otabek', 'Sherzod', 'Ulug‘bek', 'Malika', 'Nilufar', 'Dilnoza', 'Kamola', 'Rustam', 'Farrux', 'Javohir', 'Shahzod'];
const LAST = ['Karimov', 'Rahimov', 'Toshmatov', 'Yusupov', 'Abdullayev', 'Ismoilov', 'Nazarov', 'Qodirov', 'Ergasheva', 'Saidova', 'Hasanova', 'Mirzayeva', 'Aliyev', 'Sobirov', 'Xolmatov', 'Umarov'];

const DEALERS = [
	['autoleader', 'Auto Leader Toshkent', 'TASHKENT', 'Rasmiy diler emas, lekin 8 yildan beri Chevrolet va Kia sotamiz. Har bir mashina diagnostikadan o‘tgan.'],
	['koreacars', 'Korea Cars Import', 'TASHKENT', 'Janubiy Koreyadan mashina olib kelamiz: auksion, tekshiruv, yetkazib berish va rastamojka bir joyda.'],
	['chinaev', 'China EV Center', 'TASHKENT', 'BYD, Chery, Haval — elektr va gibrid mashinalar. Kafolat va servis xizmati bor.'],
	['samavto', 'Samarqand Avto', 'SAMARKAND', 'Samarqanddagi eng katta avtosalonlardan biri. Bo‘lib to‘lash imkoniyati mavjud.'],
	['premiumuz', 'Premium Motors UZ', 'TASHKENT', 'Mercedes-Benz, BMW, Lexus va Audi. Germaniya va BAAdan buyurtma asosida olib kelamiz.'],
	['fergonaavto', 'Farg‘ona Avto Savdo', 'FERGANA', 'Farg‘ona vodiysi bo‘ylab ishonchli ikkilamchi mashinalar.'],
];

const members = [];
const hash = await bcrypt.hash(PASSWORD, 10);

const addMember = async (m, i) => {
	const _id = oid(`member:${m.memberNick}`);
	const initials = (m.memberFullName ?? m.memberNick)
		.split(' ')
		.map((w) => w[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();
	const memberImage = await saveWebp(avatarSvg(initials, (i * 47) % 360), `uploads/member/${_id}_${uuid(`avatar:${_id}`)}.webp`);
	const createdAt = daysAgo(int(120, 700));
	members.push({
		_id,
		memberType: 'USER',
		memberStatus: 'ACTIVE',
		memberAuthType: 'PHONE',
		memberPhoneVerified: true,
		memberTrusted: false,
		memberDealerVerified: false,
		memberPassword: hash,
		memberImage,
		memberProperties: 0,
		memberArticles: 0,
		memberFollowers: 0,
		memberFollowings: 0,
		memberLikes: 0,
		memberViews: int(20, 900),
		memberComments: 0,
		memberRank: 0,
		createdAt,
		updatedAt: createdAt,
		...m,
	});
};

await rm(UPLOADS, { recursive: true, force: true });
for (const dir of ['property', 'member', 'article']) await mkdir(path.join(UPLOADS, dir), { recursive: true });

let n = 0;
await addMember(
	{
		memberType: 'ADMIN',
		memberAdminRole: 'SUPER',
		memberTrusted: true,
		memberNick: 'admin',
		memberFullName: 'CarPort Admin',
		memberPhone: '998900000001',
		memberAddress: 'Toshkent',
	},
	n++,
);
for (const [nick, name, city, desc] of DEALERS) {
	await addMember(
		{
			memberType: 'AGENT',
			memberTrusted: true,
			memberDealerVerified: chance(0.7),
			memberResponseMinutes: int(3, 45),
			memberNick: nick,
			memberFullName: name,
			memberPhone: `99890${String(1000000 + n * 111111).slice(0, 7)}`,
			memberAddress: pick(CITIES[city]),
			memberDesc: desc,
			memberFollowers: int(15, 400),
			memberRank: int(20, 300),
		},
		n++,
	);
}
for (let i = 0; i < 12; i++) {
	const first = FIRST[i % FIRST.length];
	const last = LAST[(i * 5) % LAST.length];
	const nick = `${first.toLowerCase().replace(/[^a-z]/g, '')}${int(10, 99)}`.slice(0, 12);
	await addMember(
		{
			memberNick: nick,
			memberFullName: `${first} ${last}`,
			memberPhone: `9989${pick(['0', '1', '3', '4', '7', '9'])}${String(2000000 + i * 523417).slice(0, 7)}`,
			memberAddress: pick(Object.values(CITIES).flat()),
			memberTrusted: i % 3 !== 0,
			memberStatus: i === 11 ? 'BLOCK' : 'ACTIVE',
			memberBlockReason: i === 11 ? 'Bir xil e’lonni ko‘p marta joylagan' : undefined,
		},
		n++,
	);
}
const dealers = members.filter((m) => m.memberType === 'AGENT');
const users = members.filter((m) => m.memberType === 'USER');

/* ---------- cars ---------- */
const DESC_PARTS = [
	'Mashina ideal holatda, hech qanday texnik muammo yo‘q.',
	'Har 10 000 km da moy almashtirilgan, servis kitobchasi bor.',
	'Salon toza, chekilmagan, bolalar o‘tirmagan.',
	'Yangi shinalar (2026 yil), qishki shinalar ham beriladi.',
	'Kraska toza, faqat bamper polirovka qilingan.',
	'Konditsioner, multimedia, orqa kamera ishlaydi.',
	'Birinchi egasidan, hujjatlari joyida.',
	'Shahar ichida yurilgan, trassaga kam chiqilgan.',
	'Tonirovka ruxsatnomasi bor.',
	'Ko‘rib, diagnostikadan o‘tkazishingiz mumkin.',
];

const properties = [];
const TOTAL_CARS = 64;
for (let i = 0; i < TOTAL_CARS; i++) {
	// a third of the cars are abroad (Korea, China, ...), the rest in Uzbekistan
	const abroad = i % 3 === 2;
	const carCountry = abroad ? pick(Object.keys(ABROAD)) : 'UZBEKISTAN';
	const pool = abroad ? CATALOG.filter((c) => ABROAD_BRANDS[carCountry].includes(c[0])) : CATALOG;
	const [carBrand, carModel, propertyType, carFuel, carTransmission, carEngine, [lo, hi]] = pick(pool);
	const carYear = int(2014, 2026);
	const age = 2026 - carYear;
	const carMileage = age === 0 ? int(0, 3000) : Math.round((age * int(9000, 19000)) / 100) * 100;
	const base = lo + rand() * (hi - lo);
	const propertyPrice = Math.max(2500, Math.round((base * Math.pow(0.9, age)) / 100) * 100);
	const [colorName, colorHex] = pick(COLORS);
	const seller = abroad || chance(0.45) ? pick(dealers) : pick(users.filter((u) => u.memberStatus === 'ACTIVE'));
	const propertyLocation = abroad ? undefined : seller.memberType === 'AGENT' && chance(0.6) ? pick(['TASHKENT', 'SAMARKAND', 'FERGANA']) : pick(Object.keys(CITIES));
	const propertyAddress = abroad ? pick(ABROAD[carCountry]) : pick(CITIES[propertyLocation]);
	const inUzs = !abroad && chance(0.35);
	const status = i < 52 ? 'ACTIVE' : pick(['PENDING', 'PENDING', 'SOLD', 'REJECTED']);
	const createdAt = daysAgo(status === 'ACTIVE' ? int(0, 90) : int(5, 120));
	const accident = chance(0.7) ? 'NONE' : chance(0.75) ? 'MINOR' : 'SERIOUS';
	const _id = oid(`property:${i}`);
	const car = {
		_id,
		propertyType,
		propertyStatus: status,
		carCountry,
		...(propertyLocation && { propertyLocation }),
		propertyAddress,
		propertyTitle: `${brandLabel(carBrand)} ${carModel} ${carYear}`,
		propertyPrice,
		propertyPriceCurrency: inUzs ? 'UZS' : 'USD',
		propertyPriceOriginal: inUzs ? Math.round((propertyPrice * 12700) / 1000000) * 1000000 : propertyPrice,
		carBrand,
		carModel,
		carYear,
		carMileage,
		carFuel,
		carTransmission,
		carColor: colorName,
		...(carEngine && { carEngine }),
		carTrim: pick(['Base', 'Comfort', 'Elegant', 'Premier', 'Luxe', 'Sport', 'Full']),
		carVin: chance(0.6) ? createHash('sha1').update(_id).digest('hex').slice(0, 17).toUpperCase().replace(/[IOQ]/g, '7') : undefined,
		carAccidentHistory: accident,
		carOwners: age === 0 ? 1 : int(1, Math.min(4, 1 + Math.floor(age / 3))),
		carCustomsCleared: !abroad,
		...(abroad && { carDeliveryDays: DELIVERY[carCountry][0] + int(-4, 8), carDeliveryCost: DELIVERY[carCountry][1] + int(-200, 400) }),
		propertyViews: status === 'PENDING' ? 0 : int(15, 2400),
		propertyLikes: status === 'PENDING' ? 0 : int(0, 85),
		propertyComments: 0,
		propertyRank: int(0, 60),
		propertyDesc: Array.from({ length: int(2, 4) }, () => pick(DESC_PARTS))
			.filter((v, k, all) => all.indexOf(v) === k)
			.join(' ')
			.concat(accident === 'MINOR' ? ' Kichik kosmetik ta’mir qilingan (bamper).' : accident === 'SERIOUS' ? ' Avariyadan keyin tiklangan, hujjatlari bor.' : ''),
		propertyBarter: chance(0.25),
		propertyNegotiable: chance(0.55),
		...(status === 'REJECTED' && { propertyRejectReason: 'Rasmlar sifatsiz: mashinani yorug‘ joyda, to‘liq ko‘rinadigan qilib suratga oling.' }),
		...(status === 'SOLD' && { soldAt: daysAgo(int(0, 4)) }),
		memberId: seller._id,
		createdAt,
		updatedAt: createdAt,
	};
	car.propertyImages = [];
	for (let s = 0; s < SHOTS.length; s++)
		car.propertyImages.push(await saveWebp(carSvg(car, colorHex, SHOTS[s], s), `uploads/property/${seller._id}_${uuid(`${_id}:${s}`)}.webp`));
	properties.push(car);
	if (status !== 'DELETE') seller.memberProperties++;
	seller.memberLikes += car.propertyLikes;
}

/* ---------- community articles ---------- */
const ARTICLES = [
	['NEWS', '2026 yilda O‘zbekistonda eng ko‘p sotilgan mashinalar', 'Yil boshidan buyon Cobalt, Gentra va Tracker yetakchilikni saqlab qolmoqda. Elektr mashinalar ulushi esa ikki baravar oshdi: BYD Song Plus va Chazor eng ko‘p qidirilgan modellar qatorida.'],
	['NEWS', 'Elektromobillar uchun bojxona imtiyozlari uzaytirildi', 'Elektr mashinalarni olib kirishda bojxona to‘lovlari bo‘yicha imtiyozlar yana bir yilga uzaytirildi. Bu Xitoydan olib kelinadigan BYD va boshqa modellar narxiga to‘g‘ridan-to‘g‘ri ta’sir qiladi.'],
	['RECOMMEND', 'Ikkilamchi mashina olishdan oldin 10 ta tekshiruv', 'Kuzov qalinligini o‘lchang, VIN raqamni hujjat bilan solishtiring, dvigatelni sovuq holatda ishga tushirib ko‘ring, diagnostikadan o‘tkazing va servis tarixini so‘rang. Shoshilmang — yaxshi mashina kutadi.'],
	['RECOMMEND', 'Koreyadan mashina olib kelish: qadam-baqadam', 'Auksion hisobotini o‘qing, probegni tekshiring, yetkazib berish va rastamojka xarajatlarini oldindan hisoblang. Odatda Seuldan Toshkentgacha 25–35 kun ketadi.'],
	['SERVICE', 'Qishga tayyorgarlik: antifriz, akkumulyator, shinalar', 'Harorat 5°C dan tushishi bilan qishki shinaga o‘ting. Akkumulyator 4 yildan oshgan bo‘lsa, quvvatini tekshirtiring. Antifriz darajasi va muzlash nuqtasini ham unutmang.'],
	['SERVICE', 'Metan yoki propan: qaysi biri arzonroq?', 'Shaharda kuniga 60 km yuradigan haydovchi uchun metan yiliga sezilarli tejash beradi, lekin ballon bagajdan joy oladi. Propan esa o‘rnatishda arzonroq, ammo narxi qimmatroq.'],
	['FREE', 'Birinchi mashinam — Spark yoki Nexia 3?', 'Byudjet 8 000 dollar atrofida. Shaharda ishga qatnash uchun kerak. Spark tejamkor, Nexia 3 esa kengroq. Tajribali haydovchilar nima maslahat beradi?'],
	['FREE', 'Toshkentda eng yaxshi avtoyuvish joylari', 'Chilonzor va Yunusobodda o‘zim sinab ko‘rgan uchta joyni yozib qoldiraman. Siz ham o‘z tavsiyalaringizni izohlarda qoldiring.'],
];
const boardArticles = [];
for (let i = 0; i < ARTICLES.length; i++) {
	const [articleCategory, articleTitle, text] = ARTICLES[i];
	const author = articleCategory === 'NEWS' ? members[0] : articleCategory === 'FREE' ? pick(users.filter((u) => u.memberStatus === 'ACTIVE')) : pick(dealers);
	const _id = oid(`article:${i}`);
	const createdAt = daysAgo(int(1, 60));
	boardArticles.push({
		_id,
		articleCategory,
		articleStatus: 'ACTIVE',
		articleTitle,
		articleContent: `<p>${esc(text)}</p>`,
		articleImage: await saveWebp(articleSvg(articleTitle, (i * 53) % 360), `uploads/article/${author._id}_${uuid(`article:${_id}`)}.webp`),
		articleLikes: int(0, 60),
		articleViews: int(30, 1500),
		articleComments: 0,
		memberId: author._id,
		createdAt,
		updatedAt: createdAt,
	});
	author.memberArticles++;
}

/* ---------- write ---------- */
const ID_FIELDS = new Set(['_id', 'memberId']);
const DATE_FIELDS = new Set(['createdAt', 'updatedAt', 'soldAt', 'deletedAt']);
const toEjson = (doc) =>
	Object.fromEntries(
		Object.entries(doc)
			.filter(([, v]) => v !== undefined)
			.map(([k, v]) => [k, ID_FIELDS.has(k) ? $oid(v) : DATE_FIELDS.has(k) ? $date(v) : v]),
	);

const data = {
	_info: {
		description: 'CarPort seed data. MongoDB Extended JSON: _id/memberId are {$oid}, dates are {$date}.',
		generatedBy: 'node seed/generate.mjs',
		images: 'Paths point to seed/uploads/...; copy that folder to the API uploads/ folder on import.',
		counts: { members: members.length, properties: properties.length, boardArticles: boardArticles.length },
	},
	members: members.map(toEjson),
	properties: properties.map(toEjson),
	boardArticles: boardArticles.map(toEjson),
};
await writeFile(path.join(ROOT, 'data.json'), JSON.stringify(data, null, '\t') + '\n');
console.log(data._info.counts, 'images:', members.length + properties.length * SHOTS.length + boardArticles.length);
