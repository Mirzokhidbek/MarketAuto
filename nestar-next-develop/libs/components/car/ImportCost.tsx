import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { formatNumber } from '../../format';
import { GET_IMPORT_COST } from '../../../apollo/user/query';
import { usePrice } from '../../hooks/usePrice';
import { InfoIcon as InfoOutlinedIcon } from '../ui/icons';
import { formatDate } from '../../date';

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

/** one colour per part, shared by the bar and the table */
const PART_COLORS: Record<string, string> = {
	CAR: 'bg-ink',
	SHIPPING: 'bg-[#64748b]',
	DUTY: 'bg-primary',
	EXCISE: 'bg-[#7c3aed]',
	VAT: 'bg-[#0891b2]',
	UTILIZATION: 'bg-[#f59e0b]',
	CLEARANCE: 'bg-[#94a3b8]',
};

const COMPARE_TONES: Record<string, { box: string; title: string }> = {
	CHEAPER: { box: 'bg-[#e6f4ea]', title: 'text-[#127a46]' },
	MORE_EXPENSIVE: { box: 'bg-[#fef7e0]', title: 'text-[#a05a00]' },
	SIMILAR: { box: 'bg-[#e6efff]', title: 'text-[#0049bd]' },
};

const cell = 'border-b border-line py-[9px] text-left font-normal text-text';
const swatch = 'mr-2.5 inline-block size-2 rounded-[2px] align-[1px]';

const summaryValue = 'm-0 mt-0.5 text-[15px] font-semibold text-ink tabular-nums';
const basisCell = `${cell} px-3 text-xs text-muted max-[480px]:hidden`;
const amountCell = `${cell} text-right font-semibold whitespace-nowrap text-ink tabular-nums`;
const compareBox = 'flex flex-col gap-0.5 rounded-[10px] px-3.5 py-3 text-[13px] text-muted';

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
	const query = useQuery<any>(GET_IMPORT_COST, {
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
		<a
			className="group mt-2 mb-3 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 rounded-[10px] border border-line px-3 py-2.5 text-[13px] text-muted no-underline hover:border-primary"
			href={'#import-cost'}
		>
			<span>{t('With customs in Uzbekistan')}</span>
			<strong className="ml-auto text-[15px] whitespace-nowrap text-ink group-hover:text-primary">≈ {price(cost.totalUsd)}</strong>
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
	const percent = (value: number) => `${formatNumber(value, { decimals: 1, grouping: false })}%`;
	const tone = comparison ? COMPARE_TONES[comparison.verdict] : undefined;

	return (
		<section className="mt-8 border-t border-line pt-8 font-sans" id={'import-cost'}>
			<header className="flex flex-col items-start justify-between gap-2 md:flex-row md:gap-4">
				<div>
					<h2 className="m-0 mb-1 text-lg font-bold tracking-[-0.01em] text-ink">{t('Import cost to Uzbekistan')}</h2>
					<p className="m-0 text-[13px] text-muted">{t("Calculated from this car's data, today's exchange rate and the current customs rates.")}</p>
				</div>
				<span
					className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-[#127a46]"
					title={t('Refreshed every minute') as string}
				>
					<i aria-hidden className="size-[7px] animate-pulse rounded-full bg-[#127a46] motion-reduce:animate-none" />
					{t('Updated')} {formatDate(cost.calculatedAt, 'HH:mm')}
				</span>
			</header>

			<div className="mt-5 mb-4 grid grid-cols-1 items-center gap-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-6">
				<div className="flex flex-col gap-0.5">
					<span className="text-xs text-muted">{t('Total, registered in Uzbekistan')}</span>
					<strong className="text-2xl leading-[1.15] tracking-[-0.02em] text-ink tabular-nums min-[481px]:text-[28px]">{price(cost.totalUsd)}</strong>
					<em className="text-[13px] text-muted not-italic">≈ {other(cost.totalUsd)}</em>
				</div>
				<dl className="m-0 grid grid-cols-2 gap-3 min-[481px]:grid-cols-3">
					<div>
						<dt className="text-xs text-muted">{t('Car price')}</dt>
						<dd className={summaryValue}>{price(cost.carPriceUsd)}</dd>
					</div>
					<div>
						<dt className="text-xs text-muted">{t('Extra costs')}</dt>
						<dd className={`${summaryValue} text-[#a05a00]`}>
							+{price(cost.extraUsd)} <small className="font-medium text-muted">(+{percent(cost.extraPercent)})</small>
						</dd>
					</div>
					<div>
						<dt className="text-xs text-muted">{t('Delivery time')}</dt>
						<dd className={summaryValue}>{cost.deliveryDays ? `~${cost.deliveryDays} ${t('days')}` : '—'}</dd>
					</div>
				</dl>
			</div>

			{/* where the money goes: one bar, each part as wide as its share of the total */}
			<div className="flex h-2.5 overflow-hidden rounded-full bg-surface" role={'img'} aria-label={t('Cost structure') as string}>
				{shares.map((item) => (
					<span
						key={item.key}
						className={`min-w-[3px] [&+&]:border-l-2 [&+&]:border-white ${PART_COLORS[item.key] ?? 'bg-faint'}`}
						style={{ width: `${(item.amountUsd / cost.totalUsd) * 100}%` }}
						title={`${t(item.key === 'CAR' ? 'Car price' : ITEM_LABELS[item.key])}: ${price(item.amountUsd)}`}
					/>
				))}
			</div>

			<table className="mt-3 w-full border-collapse text-sm">
				<tbody>
					<tr>
						<th className={cell}>
							<i className={`${swatch} ${PART_COLORS.CAR}`} />
							{t('Car price')}
						</th>
						<td className={basisCell} />
						<td className={amountCell}>{price(cost.carPriceUsd)}</td>
					</tr>
					{items.map((item) => (
						<tr key={item.key}>
							<th className={cell}>
								<i className={`${swatch} ${PART_COLORS[item.key] ?? 'bg-faint'}`} />
								{t(ITEM_LABELS[item.key] ?? item.key)}
							</th>
							<td className={basisCell}>{BASIS_LABELS[item.basis] ? t(BASIS_LABELS[item.basis]) : item.basis}</td>
							<td className={amountCell}>{item.amountUsd ? price(item.amountUsd) : '—'}</td>
						</tr>
					))}
				</tbody>
				<tfoot>
					<tr className="[&>*]:border-b-0 [&>*]:text-[15px] [&>*]:font-bold [&>*]:text-ink">
						<th className={cell}>{t('Total')}</th>
						<td className={basisCell} />
						<td className={amountCell}>{price(cost.totalUsd)}</td>
					</tr>
				</tfoot>
			</table>

			<ul className="mt-1 mb-4 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-[13px] text-muted [&_b]:font-semibold [&_b]:text-ink">
				<li>
					{t('Age')}: <b>{cost.ageYears ? `${cost.ageYears} ${t('yrs')}` : t('new')}</b>
				</li>
				{cost.engineCc && (
					<li>
						{t('Engine')}: <b>{formatNumber(cost.engineCc).replace(/,/g, ' ')} cm³</b>
						{cost.warnings.includes('ENGINE_ASSUMED') && ` (${t('assumed')})`}
					</li>
				)}
				<li>
					{t('Customs value')}: <b>{price(cost.customsValueUsd)}</b>
				</li>
			</ul>

			{comparison ? (
				<div className={`${compareBox} ${tone?.box ?? 'bg-surface'}`}>
					<strong className={`text-[15px] ${tone?.title ?? 'text-ink'}`}>
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
				<div className={`${compareBox} bg-surface`}>
					<span>{t('Not enough similar cars in Uzbekistan to compare yet.')}</span>
				</div>
			)}

			{cost.warnings.length > 0 && (
				<ul className="mt-3.5 flex list-none flex-col gap-1.5 p-0">
					{cost.warnings.map((code: string) => (
						<li key={code} className="flex gap-2 text-[13px] leading-normal text-text">
							<InfoOutlinedIcon fontSize={'small'} className="mt-px shrink-0 text-[#a05a00]" />
							{t(WARNINGS[code] ?? code, { cc: formatNumber(cost.engineCc).replace(/,/g, ' ') })}
						</li>
					))}
				</ul>
			)}

			<footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-[#cfd5df] pt-3 text-xs text-muted">
				<span>
					{t('Rate')}: 1 USD = {formatNumber(cost.usdToUzs, { decimals: 2 }).replace(/,/g, ' ')} {t("so'm")} (
					{t(cost.rateSource === 'CBU' ? 'Central Bank' : 'last known rate')},{' '}
					{formatDate(cost.rateUpdatedAt, 'DD.MM HH:mm')})
				</span>
				<span>
					{t('Customs rates')}:{' '}
					{cost.tariffUpdatedAt ? formatDate(cost.tariffUpdatedAt, 'DD.MM.YYYY') : t('starting values')}
				</span>
				<p className="m-0 basis-full">{t('This is an estimate. Confirm the exact amount with a customs broker before you buy.')}</p>
			</footer>
		</section>
	);
};

export default ImportCostCard;
