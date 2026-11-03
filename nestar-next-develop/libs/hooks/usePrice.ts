import { useReactiveVar } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { formatNumber } from '../format';
import { currencyVar, usdRateVar } from '../../apollo/store';

/** a car (or just a USD amount): prices are stored in USD, plus the seller's own so'm amount when typed in so'm */
type Priced = number | undefined | { propertyPrice: number; propertyPriceCurrency?: string; propertyPriceOriginal?: number };

/**
 * `price(car)` shows the price in the currency picked in the header, `other(car)` in the other one.
 * The seller's exact so'm amount is shown as typed ("300 000 000 so'm"); converted so'm amounts are
 * rounded ("≈ 438 mln so'm") because a rate conversion is never exact.
 */
export const usePrice = () => {
	const { t } = useTranslation('common');
	const currency = useReactiveVar(currencyVar);
	const rate = useReactiveVar(usdRateVar);

	const parse = (value: Priced) => {
		if (typeof value === 'object' && value) {
			const original = value.propertyPriceCurrency === 'UZS' ? value.propertyPriceOriginal : undefined;
			return { usd: value.propertyPrice ?? 0, uzs: original };
		}
		return { usd: value ?? 0, uzs: undefined as number | undefined };
	};

	const usd = (amount: number) => `$${formatNumber(amount)}`;
	const exactUzs = (amount: number) => `${formatNumber(amount).replace(/,/g, ' ')} ${t("so'm")}`;
	const roundUzs = (amount: number) => {
		if (amount >= 1e9) return `${formatNumber(amount / 1e9, { decimals: 1, grouping: false })} ${t('bln')} ${t("so'm")}`.replace('.', ',');
		if (amount >= 1e6) return `${formatNumber(amount / 1e6, { decimals: amount >= 1e8 ? 0 : 1, grouping: false })} ${t('mln')} ${t("so'm")}`.replace('.', ',');
		return exactUzs(Math.round(amount / 1000) * 1000);
	};

	const inUzs = (value: Priced) => {
		const { usd: amount, uzs } = parse(value);
		return uzs ? exactUzs(uzs) : roundUzs(amount * rate);
	};
	const inUsd = (value: Priced) => {
		const { usd: amount, uzs } = parse(value);
		return uzs ? usd(Math.round(uzs / rate)) : usd(amount);
	};

	return {
		currency,
		rate,
		price: (value: Priced) => (currency === 'UZS' ? inUzs(value) : inUsd(value)),
		other: (value: Priced) => (currency === 'UZS' ? inUsd(value) : inUzs(value)),
	};
};
