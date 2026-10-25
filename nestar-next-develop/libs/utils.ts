import numeral from 'numeral';
import { sweetMixinErrorAlert } from './sweetAlert';

const enumLabelExceptions: Record<string, string> = {
	BMW: 'BMW',
	BYD: 'BYD',
	SUV: 'SUV',
	CVT: 'CVT',
	MERCEDES_BENZ: 'Mercedes-Benz',
};

/** SUV -> SUV, TASHKENT_REGION -> Tashkent Region **/
export const formatEnumLabel = (value: string | undefined): string => {
	if (!value) return '';
	if (enumLabelExceptions[value]) return enumLabelExceptions[value];
	return value
		.split('_')
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(' ');
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

export const formatCountry = (country: string | undefined): string => {
	if (!country) return '';
	return `${countryFlags[country] ?? ''} ${
		country === 'USA' || country === 'UAE' ? country : formatEnumLabel(country)
	}`.trim();
};

/** Uzbek cars: "address, City"; foreign cars: "address, Country" **/
export const formatCarPlace = (property: any): string => {
	if (!property) return '';
	const area =
		property.carCountry === 'UZBEKISTAN'
			? formatEnumLabel(property.propertyLocation)
			: formatEnumLabel(property.carCountry);
	return [property.propertyAddress, area].filter(Boolean).join(', ');
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
		console.log('ERROR, likeTargetPropertyHandler:', err.message);
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
		console.log('ERROR, likeTargetBoardArticleHandler:', err.message);
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
		console.log('ERROR, likeTargetMemberHandler:', err.message);
		sweetMixinErrorAlert(err.message).then();
	}
};
