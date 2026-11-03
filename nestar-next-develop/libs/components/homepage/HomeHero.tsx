import { useQuery } from '@apollo/client/react';
import { GET_CAR_MODELS } from '../../../apollo/user/query';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { CarBrand, CarCountry } from '../../enums/property.enum';
import { formatEnumLabel } from '../../utils';
import Link from 'next/link';
import CarOrigin from '../car/CarOrigin';
import { PropertiesInquiry } from '../../types/property/property.input';
import { SearchIcon } from '../ui/icons';
import PageContainer from '../ui/PageContainer';
import { buttonClasses } from '../ui/Button';
import { cx } from '../ui/classNames';

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
	const { data: modelsData } = useQuery<any>(GET_CAR_MODELS, { skip: !brand, variables: { brand } });

	const searchHandler = async () => {
		const search: PropertiesInquiry['search'] = {};
		if (brand) search.brandList = [brand as CarBrand];
		if (model.trim()) search.model = model.trim();
		if (priceOptions[price].range) search.pricesRange = priceOptions[price].range!;
		if (yearOptions[year].range) search.yearsRange = yearOptions[year].range!;
		await router.push(searchHref(search));
	};

	const field = 'flex min-w-0 flex-col gap-0.5 border-line px-3.5 pt-2.5 pb-2 text-left focus-within:bg-surface';
	const label = 'font-sans text-xs font-semibold text-muted';
	const control = 'h-[26px] min-w-0 cursor-pointer border-0 bg-transparent p-0 font-sans text-[15px] font-medium text-text outline-none';

	return (
		<section className="relative border-b border-line bg-white pt-[88px] pb-7 font-sans sm:pt-24 sm:pb-8 md:pt-28 md:pb-10 max-sm:[.is-telegram_&]:pt-20">
			<PageContainer>
				<h1 className="mt-3 mb-3 max-w-[760px] text-[28px] leading-[1.08] font-extrabold tracking-[-0.03em] text-ink sm:text-4xl md:text-[44px] md:tracking-[-0.035em] max-sm:[.is-telegram_&]:mb-3.5 max-sm:[.is-telegram_&]:text-2xl">
					{t('Cars from around the world — for Uzbekistan.')}
				</h1>
				{/* the Mini App opens on the search: no marketing paragraph there */}
				<p className="mt-0 mb-5 max-w-[640px] text-[15px] leading-[1.55] text-muted sm:mb-7 sm:text-base max-sm:[.is-telegram_&]:hidden">
					{t(
						'Find new and used cars from trusted sellers in Uzbekistan, South Korea, China, Japan, the US, Germany and the UAE — and contact them directly.',
					)}
				</p>

				<form
					className="grid w-full grid-cols-2 items-stretch overflow-hidden rounded-[10px] border border-line-strong bg-white sm:grid-cols-[repeat(2,minmax(0,1fr))_auto] lg:grid-cols-[1.1fr_1.1fr_1fr_1fr_auto]"
					role={'search'}
					onSubmit={(e) => {
						e.preventDefault();
						searchHandler();
					}}
				>
					<label className={cx(field, 'border-r border-b lg:border-b-0')}>
						<span className={label}>{t('Make')}</span>
						<select className={control} value={brand} onChange={(e) => setBrand(e.target.value)}>
							<option value={''}>{t('Any Make')}</option>
							{Object.values(CarBrand).map((item) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={cx(field, 'border-b sm:col-span-2 lg:col-span-1 lg:border-r lg:border-b-0')}>
						<span className={label}>{t('Model')}</span>
						<input
							className={cx(control, 'cursor-text')}
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
					<label className={cx(field, 'border-r')}>
						<span className={label}>{t('Price Range')}</span>
						<select className={control} value={price} onChange={(e) => setPrice(Number(e.target.value))}>
							{priceOptions.map((item, index) => (
								<option value={index} key={item.label}>
									{t(item.label)}
								</option>
							))}
						</select>
					</label>
					<label className={cx(field, 'sm:border-r')}>
						<span className={label}>{t('Year')}</span>
						<select className={control} value={year} onChange={(e) => setYear(Number(e.target.value))}>
							{yearOptions.map((item, index) => (
								<option value={index} key={item.label}>
									{t(item.label)}
								</option>
							))}
						</select>
					</label>
					<button
						type={'submit'}
						className={buttonClasses({
							className: 'col-span-full m-0 min-h-12 rounded-none sm:col-span-1 sm:m-1.5 sm:min-h-[58px] sm:rounded-md sm:px-6',
						})}
					>
						<SearchIcon /> {t('Search')}
					</button>
				</form>

				{/* phones: wrapped pills; larger screens: one line of plate badges */}
				<nav
					className="mt-[18px] flex flex-wrap items-center gap-2 font-sans text-[13px] text-muted sm:gap-x-[18px] sm:gap-y-1.5"
					aria-label={t('Cars from') as string}
				>
					<span className="max-sm:basis-full">{t('Cars from')}:</span>
					{origins.map((country) => (
						<Link
							href={searchHref({ countryList: [country] })}
							key={country}
							className="group inline-flex max-sm:rounded-full max-sm:border max-sm:border-line max-sm:bg-white max-sm:px-2.5 max-sm:py-1.5"
						>
							<CarOrigin country={country} className="text-text group-hover:text-primary" />
						</Link>
					))}
					<Link href={'/property'} className="ml-auto inline-block font-semibold text-primary underline-offset-[3px] hover:underline max-sm:hidden">
						{t('More filters')} →
					</Link>
				</nav>
			</PageContainer>
		</section>
	);
};

export default HomeHero;
