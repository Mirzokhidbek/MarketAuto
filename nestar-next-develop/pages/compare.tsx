import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { compareVar } from '../apollo/store';
import { GET_PROPERTY } from '../apollo/user/query';
import { toggleCompare } from '../libs/compare';
import { usePrice } from '../libs/hooks/usePrice';
import { formatCarPlace, formatCountry, formatEngine, formatEnumLabel, formatMileage, imageUrl } from '../libs/utils';
import { Property } from '../libs/types/property/property';
import { CarIcon as DirectionsCarFilledOutlinedIcon } from '../libs/components/ui/icons';
import PageContainer from '../libs/components/ui/PageContainer';
import { buttonClasses } from '../libs/components/ui/Button';
import { cx } from '../libs/components/ui/classNames';

const cell = 'border-b border-line px-4 py-3 text-left align-top text-sm';
const head = `${cell} w-[180px] bg-[#f1f3f6] font-medium text-muted`;

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** loads one car of the comparison (each id is fetched separately and cached by Apollo) */
const useCar = (id?: string): Property | null => {
	const { data } = useQuery<any>(GET_PROPERTY, { skip: !id, variables: { input: id }, fetchPolicy: 'cache-first' });
	return data?.getProperty ?? null;
};

const ComparePage: NextPage = () => {
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const ids = useReactiveVar(compareVar);
	const [failed, setFailed] = useState<string[]>([]);
	const cars = [useCar(ids[0]), useCar(ids[1]), useCar(ids[2])].filter(Boolean) as Property[];

	if (!ids.length) {
		return (
			<div className="pt-8 pb-20 font-sans">
				<PageContainer>
					<div className="flex flex-col items-center gap-3.5 border-y border-line px-6 py-14 text-center text-[15px] text-muted">
						<p className="m-0">{t('Add up to 3 cars to compare them side by side.')}</p>
						<Link href={'/property'} className={buttonClasses()}>
							{t('Browse cars')}
						</Link>
					</div>
				</PageContainer>
			</div>
		);
	}

	// lower is better for price and mileage, higher for year
	const best = (values: (number | undefined)[], lower: boolean) => {
		const valid = values.filter((value): value is number => typeof value === 'number');
		return valid.length > 1 ? (lower ? Math.min(...valid) : Math.max(...valid)) : undefined;
	};
	const rows: { label: string; value: (car: Property) => React.ReactNode; raw?: (car: Property) => number | undefined; lower?: boolean }[] = [
		{ label: 'Price', value: (car) => price(car), raw: (car) => car.propertyPrice, lower: true },
		{ label: 'Year', value: (car) => car.carYear, raw: (car) => car.carYear, lower: false },
		{ label: 'Mileage', value: (car) => formatMileage(car.carMileage), raw: (car) => car.carMileage, lower: true },
		{ label: 'Country', value: (car) => formatCountry(car.carCountry, t) },
		{ label: 'Location', value: (car) => formatCarPlace(car, t) },
		{ label: 'Fuel', value: (car) => formatEnumLabel(car.carFuel, t) },
		{ label: 'Transmission', value: (car) => formatEnumLabel(car.carTransmission, t) },
		{ label: 'Engine', value: (car) => formatEngine(car.carEngine) || '—' },
		{ label: 'Body type', value: (car) => formatEnumLabel(car.propertyType, t) },
		{ label: 'Accidents', value: (car) => (car.carAccidentHistory ? t(`accident_${car.carAccidentHistory}`) : '—') },
		{ label: 'Owners', value: (car) => car.carOwners ?? '—' },
		{
			label: 'Customs cleared in Uzbekistan',
			value: (car) => (car.carCustomsCleared === undefined || car.carCustomsCleared === null ? '—' : t(car.carCustomsCleared ? 'Yes' : 'No')),
		},
		{ label: 'Color', value: (car) => car.carColor || '—' },
	];

	return (
		<div className="pt-8 pb-20 font-sans">
			<PageContainer>
				<div className="mb-5 border-b border-line pb-4">
					<h2 className="m-0 mb-1 text-lg font-bold tracking-[-0.01em] text-ink sm:text-xl">{t('Compare cars')}</h2>
					<span className="text-sm text-muted">{t('Best values are highlighted in green')}</span>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full min-w-[640px] table-fixed border-collapse overflow-hidden rounded-[14px] bg-white">
						<thead>
							<tr>
								<th className={head} />
								{cars.map((car) => (
									<td key={car._id} className={cell} style={{ width: `${Math.floor(100 / Math.max(cars.length, 1))}%` }}>
										<div className="flex flex-col gap-2">
											{car.propertyImages?.[0] && !failed.includes(car._id) ? (
												<img
													src={imageUrl(car.propertyImages[0])}
													alt={car.propertyTitle}
													className="h-[130px] w-full rounded-[10px] object-cover"
													onError={() => setFailed((prev) => [...prev, car._id])}
												/>
											) : (
												<div className="flex h-[130px] w-full items-center justify-center rounded-[10px] bg-surface text-5xl text-line-strong">
													<DirectionsCarFilledOutlinedIcon />
												</div>
											)}
											<Link href={`/property/detail?id=${car._id}`} className="font-semibold text-ink hover:text-primary">
												{car.propertyTitle}
											</Link>
											<button
												type="button"
												className="cursor-pointer self-start border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-primary hover:underline"
												onClick={() => toggleCompare(car._id)}
											>
												{t('Remove')}
											</button>
										</div>
									</td>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => {
								const target = row.raw ? best(cars.map(row.raw), !!row.lower) : undefined;
								return (
									<tr key={row.label}>
										<th className={head}>{t(row.label)}</th>
										{cars.map((car) => (
											<td
												key={car._id}
												className={cx(cell, target !== undefined && row.raw?.(car) === target ? 'font-semibold text-[#188038]' : 'text-text')}
											>
												{row.value(car)}
											</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</PageContainer>
		</div>
	);
};

export default withLayoutBasic(ComparePage);
