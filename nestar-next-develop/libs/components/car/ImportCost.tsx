import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import numeral from 'numeral';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { GET_IMPORT_COST } from '../../../apollo/user/query';
import { usePrice } from '../../hooks/usePrice';

/** the estimate follows the Central Bank rate, the saved tariff and price edits: refreshed every minute */
const REFRESH_MS = 60 * 1000;

interface CostItem {
	key: string;
	amountUsd: number;
	basis: string;
}

const ITEM_LABELS: Record<string, string> = {
	SHIPPING: 'Delivery to Uzbekistan',
	DUTY: 'Customs duty',
	EXCISE: 'Excise tax',
	VAT: 'VAT',
	UTILIZATION: 'Utilization fee',
	CLEARANCE: 'Clearance and registration',
};

const BASIS_LABELS: Record<string, string> = {
	SELLER: 'from the seller',
	TARIFF: 'typical for this country',
	FIXED: 'broker, certificate, number plates',
};

const WARNINGS: Record<string, string> = {
	ENGINE_ASSUMED: 'The listing has no engine volume, so {{cc}} cm³ is assumed. Ask the seller for the exact volume.',
	SHIPPING_DEFAULT: 'The seller gave no delivery cost, so a typical cost from this country is used.',
	OLD_CAR: 'The car is older than 3 years: the highest customs rates apply and import may be restricted.',
	RATE_FALLBACK: 'The Central Bank rate is not available right now, so the last known rate is used.',
	HYBRID_AS_FUEL: 'Hybrids are counted like petrol cars; plug-in hybrids may pay less.',
};

const useImportCost = (propertyId: string, propertyPrice?: number) => {
	const query = useQuery(GET_IMPORT_COST, {
		variables: { propertyId },
		skip: !propertyId,
		pollInterval: REFRESH_MS,
		fetchPolicy: 'cache-and-network',
	});
	const { refetch } = query;
	// the seller changed the price: recalculate at once instead of waiting for the next poll
	useEffect(() => {
		if (propertyId && propertyPrice !== undefined) refetch().catch(() => undefined);
	}, [propertyId, propertyPrice, refetch]);
	return query.data?.getImportCost;
};

/** one line in the price card: what the car costs once it is customs cleared in Uzbekistan */
export const ImportCostLine = ({ propertyId, propertyPrice }: { propertyId: string; propertyPrice?: number }) => {
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const cost = useImportCost(propertyId, propertyPrice);
	if (!cost?.applicable) return null;
	return (
		<a className={'ma-import-line'} href={'#import-cost'}>
			<span>{t('With customs in Uzbekistan')}</span>
			<strong>≈ {price(cost.totalUsd)}</strong>
		</a>
	);
};

/** "What will this car cost in Uzbekistan?" — breakdown, comparison with local cars, and what was assumed */
const ImportCostCard = ({ propertyId, propertyPrice }: { propertyId: string; propertyPrice?: number }) => {
	const { t } = useTranslation('common');
	const { price, other } = usePrice();
	const cost = useImportCost(propertyId, propertyPrice);
	if (!cost?.applicable) return null;

	const items: CostItem[] = cost.items;
	const shares = [{ key: 'CAR', amountUsd: cost.carPriceUsd }, ...items].filter((item) => item.amountUsd > 0);
	const comparison = cost.comparison;
	const percent = (value: number) => `${numeral(value).format('0.[0]')}%`;

	return (
		<section className={'ma-panel ma-import'} id={'import-cost'}>
			<header className={'ma-import__head'}>
				<div>
					<h2>{t('Import cost to Uzbekistan')}</h2>
					<p>{t("Calculated from this car's data, today's exchange rate and the current customs rates.")}</p>
				</div>
				<span className={'ma-import__live'} title={t('Refreshed every minute') as string}>
					<i aria-hidden />
					{t('Updated')} {moment(cost.calculatedAt).format('HH:mm')}
				</span>
			</header>

			<div className={'ma-import__summary'}>
				<div className={'ma-import__total'}>
					<span>{t('Total, registered in Uzbekistan')}</span>
					<strong>{price(cost.totalUsd)}</strong>
					<em>≈ {other(cost.totalUsd)}</em>
				</div>
				<dl>
					<div>
						<dt>{t('Car price')}</dt>
						<dd>{price(cost.carPriceUsd)}</dd>
					</div>
					<div>
						<dt>{t('Extra costs')}</dt>
						<dd className={'is-extra'}>
							+{price(cost.extraUsd)} <small>(+{percent(cost.extraPercent)})</small>
						</dd>
					</div>
					<div>
						<dt>{t('Delivery time')}</dt>
						<dd>{cost.deliveryDays ? `~${cost.deliveryDays} ${t('days')}` : '—'}</dd>
					</div>
				</dl>
			</div>

			{/* where the money goes: one bar, each part as wide as its share of the total */}
			<div className={'ma-import__bar'} role={'img'} aria-label={t('Cost structure') as string}>
				{shares.map((item) => (
					<span
						key={item.key}
						className={`is-${item.key.toLowerCase()}`}
						style={{ width: `${(item.amountUsd / cost.totalUsd) * 100}%` }}
						title={`${t(item.key === 'CAR' ? 'Car price' : ITEM_LABELS[item.key])}: ${price(item.amountUsd)}`}
					/>
				))}
			</div>

			<table className={'ma-import__table'}>
				<tbody>
					<tr>
						<th>
							<i className={'is-car'} />
							{t('Car price')}
						</th>
						<td />
						<td>{price(cost.carPriceUsd)}</td>
					</tr>
					{items.map((item) => (
						<tr key={item.key}>
							<th>
								<i className={`is-${item.key.toLowerCase()}`} />
								{t(ITEM_LABELS[item.key] ?? item.key)}
							</th>
							<td>{BASIS_LABELS[item.basis] ? t(BASIS_LABELS[item.basis]) : item.basis}</td>
							<td>{item.amountUsd ? price(item.amountUsd) : '—'}</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr>
						<th>{t('Total')}</th>
						<td />
						<td>{price(cost.totalUsd)}</td>
					</tr>
				</tfoot>
			</table>

			<ul className={'ma-import__facts'}>
				<li>
					{t('Age')}: <b>{cost.ageYears ? `${cost.ageYears} ${t('yrs')}` : t('new')}</b>
				</li>
				{cost.engineCc && (
					<li>
						{t('Engine')}: <b>{numeral(cost.engineCc).format('0,0').replace(/,/g, ' ')} cm³</b>
						{cost.warnings.includes('ENGINE_ASSUMED') && ` (${t('assumed')})`}
					</li>
				)}
				<li>
					{t('Customs value')}: <b>{price(cost.customsValueUsd)}</b>
				</li>
			</ul>

			{comparison ? (
				<div className={`ma-import__compare is-${comparison.verdict.toLowerCase()}`}>
					<strong>
						{comparison.verdict === 'SIMILAR'
							? t('About the same as buying in Uzbekistan')
							: t(
									comparison.verdict === 'CHEAPER'
										? 'Importing is cheaper by {{amount}}'
										: 'Importing costs {{amount}} more',
									{
										amount: price(Math.abs(comparison.differenceUsd)),
									},
							  )}
					</strong>
					<span>
						{t('Same cars already in Uzbekistan')}: ≈ {price(comparison.localAverageUsd)} ·{' '}
						{t('{{count}} cars', { count: comparison.localCount })}
					</span>
				</div>
			) : (
				<div className={'ma-import__compare'}>
					<span>{t('Not enough similar cars in Uzbekistan to compare yet.')}</span>
				</div>
			)}

			{cost.warnings.length > 0 && (
				<ul className={'ma-import__warnings'}>
					{cost.warnings.map((code: string) => (
						<li key={code}>
							<InfoOutlinedIcon fontSize={'small'} />
							{t(WARNINGS[code] ?? code, { cc: numeral(cost.engineCc).format('0,0').replace(/,/g, ' ') })}
						</li>
					))}
				</ul>
			)}

			<footer className={'ma-import__foot'}>
				<span>
					{t('Rate')}: 1 USD = {numeral(cost.usdToUzs).format('0,0.[00]').replace(/,/g, ' ')} {t("so'm")} (
					{t(cost.rateSource === 'CBU' ? 'Central Bank' : 'last known rate')},{' '}
					{moment(cost.rateUpdatedAt).format('DD.MM HH:mm')})
				</span>
				<span>
					{t('Customs rates')}:{' '}
					{cost.tariffUpdatedAt ? moment(cost.tariffUpdatedAt).format('DD.MM.YYYY') : t('starting values')}
				</span>
				<p>{t('This is an estimate. Confirm the exact amount with a customs broker before you buy.')}</p>
			</footer>
		</section>
	);
};

export default ImportCostCard;
