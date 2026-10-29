import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
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
		<section className={'ma-section ma-section--tight'}>
			<div className={'ma-container ma-origins'}>
				{spotlights.map((item) => (
					<Link href={searchLink(item.country)} key={item.country}>
						<div className={'ma-spotlight'}>
							<span className={'ma-spotlight__label'}>
								<CarOrigin country={item.country} />
							</span>
							<h3>{t(item.title)}</h3>
							<p>{t(item.text)}</p>
							<span className={'ma-spotlight__cta'}>{t(item.cta)} →</span>
						</div>
					</Link>
				))}
			</div>
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
		<section className={'ma-section'}>
			<div className={'ma-container ma-how'}>
				<div>
					<h2 className={'ma-title'}>{t('How MarketAuto Works')}</h2>
					<p className={'ma-subtitle'}>{t('From search to keys in three simple steps.')}</p>
				</div>
				<ol className={'ma-how__steps'}>
					{steps.map((item, index) => (
						<li className={'ma-step'} key={item.title}>
							<span className={'ma-step__num'}>{String(index + 1).padStart(2, '0')}</span>
							<h3>{t(item.title)}</h3>
							<p>{t(item.text)}</p>
						</li>
					))}
				</ol>
				<dl className={'ma-how__trust'}>
					{reasons.map((item) => (
						<div key={item.title}>
							<dt>{t(item.title)}</dt>
							<dd>{t(item.text)}</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
};

/** TOP DEALERS **/
export const TopDealers = () => {
	const { t } = useTranslation('common');
	const { data } = useQuery(GET_AGENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: Direction.DESC, search: {} } },
	});
	const dealers: Member[] = data?.getAgents?.list ?? [];
	if (!dealers.length) return null;

	return (
		<section className={'ma-section'}>
			<div className={'ma-container'}>
				<div className={'ma-hub__head'}>
					<div>
						<h2 className={'ma-title'}>{t('Top Sellers')}</h2>
						<p className={'ma-subtitle'}>{t('Dealers and private sellers you can follow')}</p>
					</div>
					<Link href={'/agent'}>
						<span className={'ma-btn ma-btn--link'}>{t('See All Sellers')} →</span>
					</Link>
				</div>
				<div className={'ma-grid ma-grid--4'}>
					{dealers.map((dealer) => (
						<SellerCard seller={dealer} key={dealer._id} />
					))}
				</div>
			</div>
		</section>
	);
};

/** SELL CTA **/
export const SellCta = () => {
	const { t } = useTranslation('common');
	const { phone: supportPhone } = useSiteSettings();
	const user = useReactiveVar(userVar);
	const sellHref = user?._id ? '/mypage?category=addProperty' : '/account/join';

	return (
		<section className={'ma-section'}>
			<div className={'ma-container'}>
				<div className={'ma-cta'}>
					<div className={'ma-cta__text'}>
						<h2>{t('Selling a car in Uzbekistan or abroad?')}</h2>
						<p>
							{t('List your car for free and reach buyers across Uzbekistan. Every seller gets a public profile, followers and statistics.')}
						</p>
						<div className={'ma-cta__actions'}>
							<Link href={sellHref}>
								<span className={'ma-btn ma-btn--primary'}>{t('Sell a car')}</span>
							</Link>
							<Link href={'/cs'}>
								<span className={'ma-btn ma-btn--ghost'}>{t('Read FAQ')}</span>
							</Link>
						</div>
					</div>
					<div className={'ma-cta__card'}>
						<div className={'ma-cta__card-row'}>
							<SupportAgentOutlinedIcon />
							<div>
								<strong>{t('Support for Sellers')}</strong>
								<span>{t('Tashkent office')}</span>
							</div>
						</div>
						<div className={'ma-cta__card-row ma-cta__card-row--split'}>
							<span>{t('Call center')}</span>
							<strong>{supportPhone}</strong>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

/** LATEST FROM COMMUNITY (real member articles instead of sample testimonials) **/
export const LatestArticles = () => {
	const { t } = useTranslation('common');
	const { data } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 3, sort: 'createdAt', direction: Direction.DESC, search: {} } },
	});
	const articles: BoardArticle[] = data?.getBoardArticles?.list ?? [];
	if (!articles.length) return null;

	return (
		<section className={'ma-section'}>
			<div className={'ma-container'}>
				<div className={'ma-hub__head'}>
					<div>
						<h2 className={'ma-title'}>{t('From the Community')}</h2>
						<p className={'ma-subtitle'}>{t('News, reviews and tips written by MarketAuto members')}</p>
					</div>
					<Link href={'/community?articleCategory=FREE'}>
						<span className={'ma-btn ma-btn--link'}>{t('Go to Community')} →</span>
					</Link>
				</div>
				<div className={'ma-grid ma-grid--3'}>
					{articles.map((article) => (
						<ArticleCard article={article} key={article._id} />
					))}
				</div>
			</div>
		</section>
	);
};

/** FAQ **/
const faqs = [
	{ q: 'Is it free to list a car?', a: 'Yes. Private sellers and dealers can list cars on MarketAuto for free.' },
	{ q: 'Can sellers from abroad list cars?', a: 'Yes. Sellers from South Korea, China, Japan, the US, Germany, the UAE and other countries can list cars and choose the country where the car is located.' },
	{ q: 'Does MarketAuto handle payment?', a: 'No. MarketAuto is a listings platform. Buyers and sellers agree on payment directly. Always inspect the car and documents before paying.' },
	{ q: 'How do I contact a seller?', a: 'Open the car page and press "Show phone number" on the seller card to call the seller directly.' },
];

export const HomeFaq = () => {
	const { t } = useTranslation('common');
	return (
		<section className={'ma-section'}>
			<div className={'ma-container ma-container--narrow'}>
				<div className={'ma-heading'}>
					<h2 className={'ma-title'}>{t('Frequently Asked Questions')}</h2>
				</div>
				{faqs.map((item) => (
					<details className={'ma-faq'} key={item.q}>
						<summary>
							{t(item.q)}
							<ExpandMoreRoundedIcon />
						</summary>
						<p>{t(item.a)}</p>
					</details>
				))}
			</div>
		</section>
	);
};
