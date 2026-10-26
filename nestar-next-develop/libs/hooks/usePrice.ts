import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import numeral from 'numeral';
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

	const usd = (amount: number) => `$${numeral(amount).format('0,0')}`;
	const exactUzs = (amount: number) => `${numeral(amount).format('0,0').replace(/,/g, ' ')} ${t("so'm")}`;
	const roundUzs = (amount: number) => {
		if (amount >= 1e9) return `${numeral(amount / 1e9).format('0.[0]')} ${t('bln')} ${t("so'm")}`.replace('.', ',');
		if (amount >= 1e6) return `${numeral(amount / 1e6).format(amount >= 1e8 ? '0' : '0.[0]')} ${t('mln')} ${t("so'm")}`.replace('.', ',');
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
