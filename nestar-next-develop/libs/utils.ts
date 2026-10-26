import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';

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

export const likeTargetPropertyHandler = async (likeTargetProperty: any, id: string) => {
	try {
		await likeTargetProperty({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		sweetMixinErrorAlert(err.message).then();
	}
};

export const likeTargetBoardArticleHandler = async (likeTargetBoardArticle: any, id: string) => {
	try {
		await likeTargetBoardArticle({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		sweetMixinErrorAlert(err.message).then();
	}
};

export const likeTargetMemberHandler = async (likeTargetMember: any, id: string) => {
	try {
		await likeTargetMember({
			variables: {
				input: id,
			},
		});
	} catch (err: any) {
		sweetMixinErrorAlert(err.message).then();
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
