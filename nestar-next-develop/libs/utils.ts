import numeral from 'numeral';

const enumLabelExceptions: Record<string, string> = {
	BMW: 'BMW',
	BYD: 'BYD',
	SUV: 'SUV',
	CVT: 'CVT',
	MERCEDES_BENZ: 'Mercedes-Benz',
};

type Translate = (key: string) => string;

/** SUV -> SUV, TASHKENT_REGION -> Tashkent Region; pass `t` to get the localized label **/
export const formatEnumLabel = (value: string | undefined, t?: Translate): string => {
	if (!value) return '';
	const label = enumLabelExceptions[value]
		? enumLabelExceptions[value]
		: value
				.split('_')
				.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
				.join(' ');
	return t ? t(label) : label;
};

const countryFlags: Record<string, string> = {
	UZBEKISTAN: '🇺🇿',
	SOUTH_KOREA: '🇰🇷',
	CHINA: '🇨🇳',
	JAPAN: '🇯🇵',
	USA: '🇺🇸',
	GERMANY: '🇩🇪',
	UAE: '🇦🇪',
	OTHER: '🌍',
};

// registration-plate style codes used by the origin mark (see <Origin />)
export const countryCodes: Record<string, string> = {
	UZBEKISTAN: 'UZ',
	SOUTH_KOREA: 'KR',
	CHINA: 'CN',
	JAPAN: 'JP',
	USA: 'US',
	GERMANY: 'DE',
	UAE: 'AE',
	OTHER: '—',
};

/** country name without the flag */
export const countryName = (country: string | undefined, t?: Translate): string => {
	if (!country) return '';
	const label = country === 'USA' || country === 'UAE' ? country : formatEnumLabel(country);
	return t ? t(label) : label;
};

export const formatCountry = (country: string | undefined, t?: Translate): string => {
	if (!country) return '';
	const label = country === 'USA' || country === 'UAE' ? country : formatEnumLabel(country);
	return `${countryFlags[country] ?? ''} ${t ? t(label) : label}`.trim();
};

/** Uzbek cars: "address, City"; foreign cars: "address, Country" **/
export const formatCarPlace = (property: any, t?: Translate): string => {
	if (!property) return '';
	const area =
		property.carCountry === 'UZBEKISTAN'
			? formatEnumLabel(property.propertyLocation, t)
			: formatEnumLabel(property.carCountry, t);
	return [property.propertyAddress, area].filter(Boolean).join(', ');
};

/** 3 -> "3.0 L" **/
export const formatEngine = (value: number | undefined): string => (value ? `${Number(value).toFixed(1)} L` : '');

export const formatPhone = (phone: string | undefined): string => {
	if (!phone) return '';
	return phone.startsWith('+') ? phone : `+${phone}`;
};

export const articleCategoryLabels: Record<string, string> = {
	NEWS: 'Car News',
	RECOMMEND: 'Reviews & Tips',
	FREE: 'Free Talk',
	SERVICE: 'Repair & Service',
};

export const formatMileage = (value: number | undefined): string => {
	return `${numeral(value ?? 0).format('0,0')} km`;
};

export const formatterStr = (value: number | undefined): string => {
	return numeral(value).format('0,0') != '0' ? numeral(value).format('0,0') : '';
};

/** JSON from a URL query param (?input=...); a broken or hand-edited link falls back instead of crashing the page */
export const parseQueryJson = <T>(value: string | string[] | undefined, fallback: T): T => {
	if (typeof value !== 'string') return fallback;
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
	} catch {
		return fallback;
	}
};

/** uploaded image path -> URL; S3/CDN images are already absolute */
export const imageUrl = (path?: string | null): string => {
	if (!path) return '';
	return /^https?:\/\//.test(path) ? path : `${process.env.REACT_APP_API_URL}/${path}`;
};

/** fetch that gives up after `ms` (server-side rendering must not hang when the API is slow) */
export const fetchWithTimeout = async (url: string, init: RequestInit, ms = 3000): Promise<Response> => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), ms);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
};
