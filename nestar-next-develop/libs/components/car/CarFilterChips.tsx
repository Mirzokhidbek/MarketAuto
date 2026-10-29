import React from 'react';
import { useTranslation } from 'next-i18next';
import CloseIcon from '@mui/icons-material/Close';
import { countryName, formatEnumLabel, formatMileage } from '../../utils';
import { usePrice } from '../../hooks/usePrice';

interface CarFilterChipsProps {
	search: Record<string, any>;
	defaults: Record<string, any>;
	onChange: (search: Record<string, any>) => void;
}

const optionLabels: Record<string, string> = {
	carCustomsCleared: 'Customs cleared',
	propertyNegotiable: 'Negotiable',
	propertyBarter: 'Barter',
};

/** the active filters as removable chips above the results ("Kia ×", "2020–2026 ×", ...) */
const CarFilterChips = ({ search, defaults, onChange }: CarFilterChipsProps) => {
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const chips: { key: string; label: string; remove: () => void }[] = [];
	const without = (key: string, value?: string) => {
		const next = { ...search };
		if (value === undefined) delete next[key];
		else next[key] = (next[key] as string[]).filter((item) => item !== value);
		if (Array.isArray(next[key]) && !next[key].length) delete next[key];
		if (defaults[key] && next[key] === undefined) next[key] = defaults[key];
		return next;
	};
	const list = (key: string, format: (value: string) => string) =>
		(search[key] ?? []).forEach((value: string) =>
			chips.push({ key: `${key}-${value}`, label: format(value), remove: () => onChange(without(key, value)) }),
		);

	list('countryList', (value) => countryName(value, t));
	list('brandList', (value) => formatEnumLabel(value, t));
	list('typeList', (value) => formatEnumLabel(value, t));
	list('fuelList', (value) => formatEnumLabel(value, t));
	list('transmissionList', (value) => formatEnumLabel(value, t));
	list('locationList', (value) => formatEnumLabel(value, t));
	list('options', (value) => t(optionLabels[value] ?? value));
	if (search.model) chips.push({ key: 'model', label: search.model, remove: () => onChange(without('model')) });
	if (search.text) chips.push({ key: 'text', label: `"${search.text}"`, remove: () => onChange(without('text')) });
	if (search.noAccident) chips.push({ key: 'noAccident', label: t('No accidents'), remove: () => onChange(without('noAccident')) });
	const changed = (key: string) => search[key] && JSON.stringify(search[key]) !== JSON.stringify(defaults[key]);
	if (changed('yearsRange'))
		chips.push({ key: 'year', label: `${search.yearsRange.start}–${search.yearsRange.end}`, remove: () => onChange(without('yearsRange')) });
	if (changed('pricesRange'))
		chips.push({
			key: 'price',
			label: `${price(search.pricesRange.start)} – ${price(search.pricesRange.end)}`,
			remove: () => onChange(without('pricesRange')),
		});
	if (changed('mileageRange'))
		chips.push({
			key: 'mileage',
			label: `${formatMileage(search.mileageRange.start)} – ${formatMileage(search.mileageRange.end)}`,
			remove: () => onChange(without('mileageRange')),
		});

	if (!chips.length) return null;
	return (
		<div className={'ma-chips'}>
			{chips.map((chip) => (
				<button key={chip.key} className={'ma-chip-filter'} onClick={chip.remove} aria-label={`${t('Remove')}: ${chip.label}`}>
					{chip.label}
					<CloseIcon />
				</button>
			))}
			{chips.length > 1 && (
				<button className={'ma-link-btn'} onClick={() => onChange({ ...defaults })}>
					{t('Clear all')}
				</button>
			)}
		</div>
	);
};

export default CarFilterChips;
