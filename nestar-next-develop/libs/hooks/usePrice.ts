import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import numeral from 'numeral';
import { currencyVar, usdRateVar } from '../../apollo/store';

/**
 * Prices are stored in USD. `price(usd)` shows them in the currency picked in the header,
 * `other(usd)` gives the other currency for a hint line ("≈ 158 mln so'm").
 */
export const usePrice = () => {
	const { t } = useTranslation('common');
	const currency = useReactiveVar(currencyVar);
	const rate = useReactiveVar(usdRateVar);

	const usd = (value?: number) => `$${numeral(value ?? 0).format('0,0')}`;
	const uzs = (value?: number) => `${numeral(Math.round((value ?? 0) * rate)).format('0,0').replace(/,/g, ' ')} ${t("so'm")}`;

	return {
		currency,
		rate,
		price: (value?: number) => (currency === 'UZS' ? uzs(value) : usd(value)),
		other: (value?: number) => (currency === 'UZS' ? usd(value) : uzs(value)),
	};
};
