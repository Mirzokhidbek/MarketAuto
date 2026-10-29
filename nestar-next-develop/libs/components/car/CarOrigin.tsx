import React from 'react';
import { useTranslation } from 'next-i18next';
import { countryCodes, countryName } from '../../utils';

interface CarOriginProps {
	country?: string;
	/** text after the code; defaults to the country name */
	label?: string;
	/** only the plate code (tight places) */
	compact?: boolean;
}

/** where the car is: a plate-style country code + name, e.g. [KR] South Korea · Incheon */
const CarOrigin = ({ country, label, compact }: CarOriginProps) => {
	const { t } = useTranslation('common');
	if (!country) return null;
	const name = countryName(country, t);
	return (
		<span className={`ma-origin ${country === 'UZBEKISTAN' ? 'ma-origin--uz' : ''}`} title={name}>
			<b aria-hidden={!compact}>{countryCodes[country] ?? '—'}</b>
			{!compact && <span>{label ?? name}</span>}
		</span>
	);
};

export default CarOrigin;
