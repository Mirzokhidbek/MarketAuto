import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { countryCodes, countryName } from '../../utils';
import { cx } from '../ui/classNames';

interface CarOriginProps {
	country?: string;
	/** text after the code; defaults to the country name */
	label?: string;
	/** only the plate code (tight places) */
	compact?: boolean;
	className?: string;
}

/** where the car is: a plate-style country code + name, e.g. [KR] South Korea · Incheon */
const CarOrigin = ({ country, label, compact, className }: CarOriginProps) => {
	const { t } = useTranslation('common');
	if (!country) return null;
	const name = countryName(country, t);
	return (
		<span className={cx('inline-flex items-center gap-1.5 font-sans text-[13px] whitespace-nowrap text-muted', className)} title={name}>
			<b
				aria-hidden={!compact}
				className={cx(
					'inline-flex h-[18px] min-w-[26px] items-center justify-center rounded-[3px] border border-l-4 border-ink bg-white px-1 font-mono text-[10.5px] leading-none font-bold tracking-[0.04em] text-ink',
					// Uzbek plates carry the green stripe
					country === 'UZBEKISTAN' && 'border-l-[#1eb53a]',
				)}
			>
				{countryCodes[country] ?? '—'}
			</b>
			{!compact && <span className="overflow-hidden text-ellipsis">{label ?? name}</span>}
		</span>
	);
};

export default CarOrigin;
