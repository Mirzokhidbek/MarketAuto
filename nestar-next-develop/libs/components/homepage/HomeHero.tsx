import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import SearchIcon from '@mui/icons-material/Search';
import { CarBrand, CarCountry, PropertyType } from '../../enums/property.enum';
import { formatCountry, formatEnumLabel } from '../../utils';
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

const HomeHero = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [country, setCountry] = useState('');
	const [brand, setBrand] = useState('');
	const [price, setPrice] = useState(0);
	const [year, setYear] = useState(0);
	const [bodyType, setBodyType] = useState('');

	const searchHandler = async () => {
		const input: PropertiesInquiry = { page: 1, limit: 9, sort: 'createdAt', search: {} };
		if (country) input.search.countryList = [country as CarCountry];
		if (brand) input.search.brandList = [brand as CarBrand];
		if (bodyType) input.search.typeList = [bodyType as PropertyType];
		if (priceOptions[price].range) input.search.pricesRange = priceOptions[price].range!;
		if (yearOptions[year].range) input.search.yearsRange = yearOptions[year].range!;
		await router.push(`/property?input=${JSON.stringify(input)}`, `/property?input=${JSON.stringify(input)}`);
	};

	return (
		<section className={'ma-hero'}>
			<div className={'ma-hero__inner'}>
				<span className={'ma-pill'}>
					<i className={'ma-dot'} /> {t('Local & International Car Marketplace')}
				</span>
				<h1>{t('Cars from around the world — for Uzbekistan.')}</h1>
				<p className={'ma-hero__lead'}>
					{t(
						'Find new and used cars from trusted sellers in Uzbekistan, South Korea, China, Japan, the US, Germany and the UAE — and contact them directly.',
					)}
				</p>

				<div className={'ma-search'}>
					<label className={'ma-field'}>
						<span>{t('Country')}</span>
						<select value={country} onChange={(e) => setCountry(e.target.value)}>
							<option value={''}>{t('All Countries')}</option>
							{Object.values(CarCountry).map((item) => (
								<option value={item} key={item}>
									{formatCountry(item, t)}
								</option>
							))}
						</select>
					</label>
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
					<label className={'ma-field'}>
						<span>{t('Vehicle Type')}</span>
						<select value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
							<option value={''}>{t('All Types')}</option>
							{Object.values(PropertyType).map((item) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<button className={'ma-btn ma-btn--primary ma-search__btn'} onClick={searchHandler}>
						<SearchIcon /> {t('Search')}
					</button>
				</div>
			</div>
		</section>
	);
};

export default HomeHero;
