import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery, useReactiveVar } from '@apollo/client';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { compareVar } from '../apollo/store';
import { GET_PROPERTY } from '../apollo/user/query';
import { toggleCompare } from '../libs/compare';
import { usePrice } from '../libs/hooks/usePrice';
import { formatCarPlace, formatCountry, formatEngine, formatEnumLabel, formatMileage, imageUrl } from '../libs/utils';
import { Property } from '../libs/types/property/property';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** loads one car of the comparison (each id is fetched separately and cached by Apollo) */
const useCar = (id?: string): Property | null => {
	const { data } = useQuery(GET_PROPERTY, { skip: !id, variables: { input: id }, fetchPolicy: 'cache-first' });
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
			<div className={'ma-page'}>
				<div className={'ma-container'}>
					<div className={'ma-empty ma-empty--cta'}>
						<p>{t('Add up to 3 cars to compare them side by side.')}</p>
						<Link href={'/property'}>
							<span className={'ma-btn ma-btn--primary'}>{t('Browse cars')}</span>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// lower is better for price and mileage, higher for year
	const best = (values: (number | undefined)[], lower: boolean) => {
		const valid = values.filter((value): value is number => typeof value === 'number');
		return valid.length > 1 ? (lower ? Math.min(...valid) : Math.max(...valid)) : undefined;
	};
	const rows: { label: string; value: (car: Property) => React.ReactNode; raw?: (car: Property) => number | undefined; lower?: boolean }[] = [
		{ label: 'Price', value: (car) => price(car.propertyPrice), raw: (car) => car.propertyPrice, lower: true },
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
		<div className={'ma-page ma-list-page'}>
			<div className={'ma-container'}>
				<div className={'ma-results__bar'}>
					<div>
						<h2>{t('Compare cars')}</h2>
						<span>{t('Best values are highlighted in green')}</span>
					</div>
				</div>
				<div className={'ma-compare'}>
					<table>
						<thead>
							<tr>
								<th />
								{cars.map((car) => (
									<td key={car._id} style={{ width: `${Math.floor(100 / Math.max(cars.length, 1))}%` }}>
										<div className={'ma-compare__car'}>
											{car.propertyImages?.[0] && !failed.includes(car._id) ? (
												<img
													src={imageUrl(car.propertyImages[0])}
													alt={car.propertyTitle}
													onError={() => setFailed((prev) => [...prev, car._id])}
												/>
											) : (
												<div className={'ma-car-card__placeholder'}>
													<DirectionsCarFilledOutlinedIcon />
												</div>
											)}
											<Link href={`/property/detail?id=${car._id}`}>{car.propertyTitle}</Link>
											<button className={'ma-link-btn'} onClick={() => toggleCompare(car._id)}>
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
										<th>{t(row.label)}</th>
										{cars.map((car) => (
											<td key={car._id} className={target !== undefined && row.raw?.(car) === target ? 'is-best' : ''}>
												{row.value(car)}
											</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default withLayoutBasic(ComparePage);
