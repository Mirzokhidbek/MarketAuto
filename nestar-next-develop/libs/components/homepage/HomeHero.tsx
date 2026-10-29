import { useQuery } from '@apollo/client';
import { GET_CAR_MODELS } from '../../../apollo/user/query';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import SearchIcon from '@mui/icons-material/Search';
import { CarBrand, CarCountry } from '../../enums/property.enum';
import { formatEnumLabel } from '../../utils';
import Link from 'next/link';
import CarOrigin from '../car/CarOrigin';
import { PropertiesInquiry } from '../../types/property/property.input';

const priceOptions = [
	{ label: 'Any Price', range: null },
	{ label: 'Under $10,000', range: { start: 0, end: 10000 } },
	{ label: '$10,000 - $20,000', range: { start: 10000, end: 20000 } },
	{ label: '$20,000 - $40,000', range: { start: 20000, end: 40000 } },
	{ label: '$40,000+', range: { start: 40000, end: 10000000 } },
];

const thisYear = new Date().getFullYear();
const yearOptions = [
	{ label: 'Any Year', range: null },
	{ label: `2020 - ${thisYear}`, range: { start: 2020, end: thisYear } },
	{ label: `2015 - ${thisYear}`, range: { start: 2015, end: thisYear } },
	{ label: `2010 - ${thisYear}`, range: { start: 2010, end: thisYear } },
	{ label: 'Before 2010', range: { start: 1950, end: 2009 } },
];

// origins shown under the search: one click to every car from that country
const origins = [
	CarCountry.UZBEKISTAN,
	CarCountry.SOUTH_KOREA,
	CarCountry.CHINA,
	CarCountry.JAPAN,
	CarCountry.USA,
	CarCountry.GERMANY,
	CarCountry.UAE,
];

const searchHref = (search: PropertiesInquiry['search']) =>
	`/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', search })}`;

const HomeHero = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [brand, setBrand] = useState('');
	const [price, setPrice] = useState(0);
	const [year, setYear] = useState(0);
	const [model, setModel] = useState('');
	// model hints for the chosen brand
	const { data: modelsData } = useQuery(GET_CAR_MODELS, { skip: !brand, variables: { brand } });

	const searchHandler = async () => {
		const search: PropertiesInquiry['search'] = {};
		if (brand) search.brandList = [brand as CarBrand];
		if (model.trim()) search.model = model.trim();
		if (priceOptions[price].range) search.pricesRange = priceOptions[price].range!;
		if (yearOptions[year].range) search.yearsRange = yearOptions[year].range!;
		await router.push(searchHref(search));
	};

	return (
		<section className={'ma-hero'}>
			<div className={'ma-hero__inner'}>
				<h1>{t('Cars from around the world — for Uzbekistan.')}</h1>
				<p className={'ma-hero__lead'}>
					{t(
						'Find new and used cars from trusted sellers in Uzbekistan, South Korea, China, Japan, the US, Germany and the UAE — and contact them directly.',
					)}
				</p>

				<form
					className={'ma-search'}
					role={'search'}
					onSubmit={(e) => {
						e.preventDefault();
						searchHandler();
					}}
				>
					<label className={'ma-field'}>
						<span>{t('Make')}</span>
						<select value={brand} onChange={(e) => setBrand(e.target.value)}>
							<option value={''}>{t('Any Make')}</option>
							{Object.values(CarBrand).map((item) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-field'}>
						<span>{t('Model')}</span>
						<input
							type="text"
							list={'ma-hero-models'}
							value={model}
							placeholder={(brand ? t('e.g. K5, Cobalt') : t('Any model')) as string}
							onChange={(e) => setModel(e.target.value)}
						/>
						<datalist id={'ma-hero-models'}>
							{(modelsData?.getCarModels ?? []).map((item: string) => (
								<option value={item} key={item} />
							))}
						</datalist>
					</label>
					<label className={'ma-field'}>
						<span>{t('Price Range')}</span>
						<select value={price} onChange={(e) => setPrice(Number(e.target.value))}>
							{priceOptions.map((item, index) => (
								<option value={index} key={item.label}>
									{t(item.label)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-field'}>
						<span>{t('Year')}</span>
						<select value={year} onChange={(e) => setYear(Number(e.target.value))}>
							{yearOptions.map((item, index) => (
								<option value={index} key={item.label}>
									{t(item.label)}
								</option>
							))}
						</select>
					</label>
					<button type={'submit'} className={'ma-btn ma-btn--primary ma-search__btn'}>
						<SearchIcon /> {t('Search')}
					</button>
				</form>

				<nav className={'ma-hero__origins'} aria-label={t('Cars from') as string}>
					<span>{t('Cars from')}:</span>
					{origins.map((country) => (
						<Link href={searchHref({ countryList: [country] })} key={country}>
							<CarOrigin country={country} />
						</Link>
					))}
					<Link href={'/property'} className={'ma-search__more'}>
						{t('More filters')} →
					</Link>
				</nav>
			</div>
		</section>
	);
};

export default HomeHero;
