import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { GET_AGENTS, GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { BoardArticle } from '../../types/board-article/board-article';
import ArticleCard from '../community/ArticleCard';
import { userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { CarCountry } from '../../enums/property.enum';
import { Direction } from '../../enums/common.enum';
import SellerCard from '../seller/SellerCard';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import CarOrigin from '../car/CarOrigin';
import { joinHref } from '../../utils';
import { ChevronDownIcon as ExpandMoreRoundedIcon } from '../ui/icons';
import PageContainer from '../ui/PageContainer';
import { buttonClasses } from '../ui/Button';
import { cx } from '../ui/classNames';
import CarGrid from '../car/CarGrid';
import SectionHead from './SectionHead';

const seeAll = 'font-sans text-sm font-semibold text-primary underline-offset-[3px] hover:underline';

const searchLink = (country: CarCountry) =>
	`/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', search: { countryList: [country] } })}`;

/** COUNTRY SPOTLIGHT **/
const spotlights = [
	{
		country: CarCountry.SOUTH_KOREA,
		title: 'Kia, Hyundai & Genesis',
		text: 'Popular Korean models listed directly by sellers in Seoul, Incheon and Busan.',
		cta: 'Browse Korean cars',
	},
	{
		country: CarCountry.CHINA,
		title: 'Electric & Hybrid Leaders',
		text: 'BYD, Chery, Haval and more — the fastest growing brands on Uzbek roads.',
		cta: 'Browse Chinese cars',
	},
	{
		country: CarCountry.GERMANY,
		title: 'German Engineering',
		text: 'BMW, Mercedes-Benz, Audi and Volkswagen from sellers across Germany.',
		cta: 'Browse German cars',
	},
];

export const CountrySpotlight = () => {
	const { t } = useTranslation('common');
	return (
		<section className="border-t border-line pb-14 md:pb-16">
			<PageContainer className="grid grid-cols-1 border-b border-line md:grid-cols-3">
				{spotlights.map((item, index) => (
					<Link href={searchLink(item.country)} key={item.country} className="group">
						<div
							className={cx(
								'flex h-full flex-col py-[22px] font-sans text-text md:py-7 md:pr-7',
								index > 0 && 'border-t border-line md:border-t-0 md:border-l md:pl-7',
							)}
						>
							<span className="mb-3.5">
								<CarOrigin country={item.country} />
							</span>
							<h3 className="m-0 mb-1.5 text-lg font-semibold tracking-[-0.01em] text-ink">{t(item.title)}</h3>
							<p className="m-0 mb-4 text-sm leading-[1.55] text-muted">{t(item.text)}</p>
							<span className="mt-auto text-sm font-semibold text-primary underline-offset-[3px] group-hover:underline">{t(item.cta)} →</span>
						</div>
					</Link>
				))}
			</PageContainer>
		</section>
	);
};

/** HOW IT WORKS (steps + what the buyer can rely on, in one place) **/
const reasons = [
	{ title: 'Open Dealer Profiles', text: 'Every dealer has a public profile with all their cars, likes, followers and ranking.' },
	{ title: 'Local & International', text: 'Cars located in Uzbekistan and abroad — all in one search with clear country labels.' },
	{ title: 'Direct Contact', text: 'Call or message the seller directly. No middlemen and no hidden fees.' },
	{ title: 'Free Listing', text: 'Private sellers and dealers can list cars for free in a few minutes.' },
];

const steps = [
	{ title: 'Search & Compare', text: 'Filter by country, brand, year, mileage, fuel and price to find the right car.' },
	{ title: 'Contact the Seller', text: 'Ask questions, request more photos or a video call directly from the car page.' },
	{ title: 'Inspect & Buy', text: 'Check the car and documents in person, agree on the price and close the deal with the seller.' },
];

export const HowItWorks = () => {
	const { t } = useTranslation('common');
	return (
		<section className="border-t border-line py-14 font-sans md:py-16">
			<PageContainer className="grid grid-cols-1 gap-7 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-12">
				<div>
					<h2 className="m-0 text-2xl leading-[1.2] font-bold tracking-[-0.02em] text-ink">{t('How CarPort Works')}</h2>
					<p className="mt-1.5 mb-0 text-[15px] leading-[1.55] text-muted">{t('From search to keys in three simple steps.')}</p>
				</div>
				<ol className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-3 md:gap-8">
					{steps.map((item, index) => (
						<li key={item.title}>
							<span className="mb-2.5 block font-mono text-[13px] font-semibold text-primary">{String(index + 1).padStart(2, '0')}</span>
							<h3 className="m-0 mb-1.5 text-base font-semibold text-ink">{t(item.title)}</h3>
							<p className="m-0 text-sm leading-relaxed text-muted">{t(item.text)}</p>
						</li>
					))}
				</ol>
				<dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-line pt-7 sm:grid-cols-2 lg:col-start-2">
					{reasons.map((item) => (
						<div key={item.title}>
							<dt className="text-[14.5px] font-semibold text-ink">{t(item.title)}</dt>
							<dd className="mt-1 mb-0 ml-0 text-sm leading-[1.55] text-muted">{t(item.text)}</dd>
						</div>
					))}
				</dl>
			</PageContainer>
		</section>
	);
};

/** TOP DEALERS **/
export const TopDealers = () => {
	const { t } = useTranslation('common');
	const { data } = useQuery<any>(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} } },
	});
	const dealers: Member[] = data?.getAgents?.list ?? [];
	if (!dealers.length) return null;

	return (
		<section className="border-t border-line py-14 md:py-16">
			<PageContainer>
				<SectionHead title={t('Top Sellers')} subtitle={t('Dealers and private sellers you can follow')}>
					<Link href={'/agent'} className={seeAll}>
						{t('See All Sellers')} →
					</Link>
				</SectionHead>
				<CarGrid cols={4} phoneList={false}>
					{dealers.map((dealer) => (
						<SellerCard seller={dealer} key={dealer._id} />
					))}
				</CarGrid>
			</PageContainer>
		</section>
	);
};

/** SELL CTA **/
export const SellCta = () => {
	const { t } = useTranslation('common');
	const { phone: supportPhone } = useSiteSettings();
	const user = useReactiveVar(userVar);
	const sellHref = user?._id ? '/mypage?category=addProperty' : joinHref('/mypage?category=addProperty');

	return (
		<section className="border-t border-line py-14 md:py-16">
			<PageContainer>
				<div className="grid grid-cols-1 items-end gap-x-12 gap-y-8 rounded-[14px] bg-ink px-6 py-8 font-sans text-white md:grid-cols-[minmax(0,1fr)_auto] md:p-12">
					<div className="max-w-[600px]">
						<h2 className="m-0 mb-3 text-[23px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[28px]">{t('Selling a car in Uzbekistan or abroad?')}</h2>
						<p className="m-0 mb-6 text-[15.5px] leading-relaxed text-white/70">
							{t('List your car for free and reach buyers across Uzbekistan. Every seller gets a public profile, followers and statistics.')}
						</p>
						<div className="flex flex-wrap gap-3">
							<Link href={sellHref} className={buttonClasses()}>
								{t('Sell a car')}
							</Link>
							<Link href={'/cs'} className={buttonClasses({ variant: 'ghost' })}>
								{t('Read FAQ')}
							</Link>
						</div>
					</div>
					<div className="border-t border-white/15 pt-5 md:min-w-[240px] md:border-t-0 md:border-l md:pt-0 md:pl-8">
						<div className="flex flex-col gap-0.5">
							<strong className="block text-sm font-semibold">{t('Support for Sellers')}</strong>
							<span className="text-[13px] text-white/60">{t('Tashkent office')}</span>
						</div>
						<div className="mt-4 flex flex-col gap-0.5">
							<span className="text-[13px] text-white/60">{t('Call center')}</span>
							<strong className="block text-xl font-semibold tracking-[-0.01em] tabular-nums">{supportPhone}</strong>
						</div>
					</div>
				</div>
			</PageContainer>
		</section>
	);
};

/** LATEST FROM COMMUNITY (real member articles instead of sample testimonials) **/
export const LatestArticles = () => {
	const { t } = useTranslation('common');
	const { data } = useQuery<any>(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: Direction.DESC, search: {} } },
	});
	const articles: BoardArticle[] = data?.getBoardArticles?.list ?? [];
	if (!articles.length) return null;

	return (
		<section className="border-t border-line py-14 md:py-16">
			<PageContainer>
				<SectionHead title={t('From the Community')} subtitle={t('News, reviews and tips written by CarPort members')}>
					<Link href={'/community?articleCategory=FREE'} className={seeAll}>
						{t('Go to Community')} →
					</Link>
				</SectionHead>
				<CarGrid phoneList={false}>
					{articles.map((article) => (
						<ArticleCard article={article} key={article._id} />
					))}
				</CarGrid>
			</PageContainer>
		</section>
	);
};

/** FAQ **/
const faqs = [
	{ q: 'Is it free to list a car?', a: 'Yes. Private sellers and dealers can list cars on CarPort for free.' },
	{ q: 'Can sellers from abroad list cars?', a: 'Yes. Sellers from South Korea, China, Japan, the US, Germany, the UAE and other countries can list cars and choose the country where the car is located.' },
	{ q: 'Does CarPort handle payment?', a: 'No. CarPort is a listings platform. Buyers and sellers agree on payment directly. Always inspect the car and documents before paying.' },
	{ q: 'How do I contact a seller?', a: 'Open the car page and press "Show phone number" on the seller card to call the seller directly.' },
];

export const HomeFaq = () => {
	const { t } = useTranslation('common');
	return (
		<section className="border-t border-line py-14 font-sans md:py-16">
			<PageContainer className="w-[860px]!">
				<h2 className="m-0 mb-8 text-[26px] leading-[1.2] font-bold tracking-[-0.02em] text-ink">{t('Frequently Asked Questions')}</h2>
				{faqs.map((item) => (
					<details className="group border-b border-line first-of-type:border-t" key={item.q}>
						<summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[18px] text-[15.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
							{t(item.q)}
							<ExpandMoreRoundedIcon className="shrink-0 text-muted transition-transform group-open:rotate-180" />
						</summary>
						<p className="m-0 max-w-[680px] pb-5 text-[15px] leading-[1.65] text-muted">{t(item.a)}</p>
					</details>
				))}
			</PageContainer>
		</section>
	);
};
