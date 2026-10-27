import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import moment from 'moment';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import TrendChart from '../../libs/components/admin/TrendChart';
import { GET_ALL_PROPERTIES_BY_ADMIN, GET_DASHBOARD_STATS } from '../../apollo/admin/query';
import { userVar } from '../../apollo/store';
import { formatterStr, imageUrl } from '../../libs/utils';
import { T } from '../../libs/types/common';

// categorical slots 1 and 2 of the validated palette, always in this order
const SERIES_COLORS = { cars: '#2a78d6', members: '#eb6834' };

// work waiting for a person: colored cards at the top, like tasks
const TODO = [
	{ key: 'carsPending', label: 'Cars to review', desc: 'New sellers wait for approval before buyers see their cars.', href: '/_admin/properties?status=PENDING', tone: 'violet', icon: <DirectionsCarFilledOutlinedIcon /> },
	{ key: 'reportsOpen', label: 'Open reports', desc: 'Buyers complained about these listings.', href: '/_admin/reports', tone: 'blue', icon: <OutlinedFlagIcon /> },
	{ key: 'inquiriesWaiting', label: 'Questions from members', desc: 'Members wait for an answer in their account.', href: '/_admin/cs/inquiry', tone: 'green', icon: <ForumOutlinedIcon /> },
];

const STATS = [
	{ key: 'membersTotal', label: 'Members', href: '/_admin/users' },
	{ key: 'dealers', label: 'Dealers', href: '/_admin/users' },
	{ key: 'carsActive', label: 'Cars for sale', href: '/_admin/properties?status=ACTIVE' },
	{ key: 'carsSold', label: 'Sold cars', href: '/_admin/properties?status=SOLD' },
	{ key: 'articlesActive', label: 'Articles', href: '/_admin/community' },
	{ key: 'membersBlocked', label: 'Blocked members', href: '/_admin/users' },
];

const PERIODS = [7, 14, 30];

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const greeting = () => {
	const hour = new Date().getHours();
	if (hour < 5) return { text: 'Good night', icon: '🌙' };
	if (hour < 12) return { text: 'Good morning', icon: '☀️' };
	if (hour < 18) return { text: 'Good afternoon', icon: '🌤️' };
	return { text: 'Good evening', icon: '🌆' };
};

const AdminHome: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [days, setDays] = useState<number>(14);
	const { data, loading } = useQuery(GET_DASHBOARD_STATS, {
		fetchPolicy: 'cache-and-network',
		variables: { days },
		pollInterval: 60000,
	});
	const stats: T = data?.getDashboardStats ?? {};
	const daily: T[] = stats.daily ?? [];
	const sellers: T[] = stats.topSellers ?? [];
	const { data: pendingData } = useQuery(GET_ALL_PROPERTIES_BY_ADMIN, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'createdAt', direction: 'ASC', search: { propertyStatus: 'PENDING' } } },
	});
	const pending: T[] = pendingData?.getAllPropertiesByAdmin?.list ?? [];
	const hello = greeting();
	const waitingTotal = TODO.reduce((sum, item) => sum + (stats[item.key] ?? 0), 0);
	const value = (key: string) => (loading && stats[key] === undefined ? '…' : stats[key] ?? 0);

	return (
		<div className={'content ma-dash'}>
			<header className={'ma-dash__hello'}>
				<span className={'ma-dash__sun'} aria-hidden="true">
					{hello.icon}
				</span>
				<div>
					<h1>
						{t(hello.text)}, {user.memberNick}!
					</h1>
					<p>
						{waitingTotal > 0
							? t('Waiting for you today: {{count}}', { count: waitingTotal })
							: t('Nothing is waiting. Everything is checked.')}
					</p>
				</div>
			</header>

			<div className={'ma-dash__top'}>
				<section className={'ma-card'}>
					<header className={'ma-card__head'}>
						<div>
							<h2>{t('Needs attention')}</h2>
							<p>{t('Start the day here')}</p>
						</div>
					</header>
					<div className={'ma-dash__tasks'}>
						{TODO.map((item) => {
							const count: number = stats[item.key] ?? 0;
							return (
								<Link key={item.key} href={item.href} className={`ma-task ma-task--${item.tone}`}>
									<span className={'ma-task__icon'}>{item.icon}</span>
									<span className={'ma-task__body'}>
										<strong>{t(item.label)}</strong>
										<em>{t(item.desc)}</em>
									</span>
									<span className={`ma-task__count ${count ? '' : 'is-zero'}`}>{value(item.key)}</span>
									<ChevronRightIcon className={'ma-task__arrow'} />
								</Link>
							);
						})}
					</div>
				</section>

				<section className={'ma-card'}>
					<header className={'ma-card__head'}>
						<div>
							<h2>{t('Activity')}</h2>
							<p>{t('New cars and new members per day')}</p>
						</div>
						<div className={'ma-seg'} role={'group'} aria-label={t('Period') as string}>
							{PERIODS.map((period) => (
								<button key={period} className={days === period ? 'is-active' : ''} aria-pressed={days === period} onClick={() => setDays(period)}>
									{t('{{count}} days', { count: period })}
								</button>
							))}
						</div>
					</header>
					{daily.length > 0 ? (
						<TrendChart
							dates={daily.map((day) => day.date)}
							series={[
								{ key: 'cars', label: t('New cars'), color: SERIES_COLORS.cars, values: daily.map((day) => day.cars) },
								{ key: 'members', label: t('New members'), color: SERIES_COLORS.members, values: daily.map((day) => day.members) },
							]}
							tableLabel={t('Table') as string}
							chartLabel={t('Chart') as string}
							dateLabel={t('Date') as string}
						/>
					) : (
						<div className={'ma-card__empty'}>{t('Loading...')}</div>
					)}
				</section>
			</div>

			<div className={'ma-dash__bottom'}>
				<section className={'ma-card'}>
					<header className={'ma-card__head'}>
						<div>
							<h2>{t('Cars to review')}</h2>
							<p>{t('Oldest first: they have waited the longest')}</p>
						</div>
						<Link href={'/_admin/properties?status=PENDING'} className={'ma-pill-btn'}>
							{t('See all')}
						</Link>
					</header>
					{!pending.length && <div className={'ma-card__empty'}>✓ {t('Nothing waiting. Good job!')}</div>}
					<div className={'ma-list'}>
						{pending.map((car) => (
							<Link key={car._id} href={'/_admin/properties?status=PENDING'} className={'ma-list__row'}>
								<span className={'ma-list__thumb'}>
									{car.propertyImages?.[0] ? (
										<img src={imageUrl(car.propertyImages[0])} alt={''} onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
									) : (
										<DirectionsCarFilledOutlinedIcon />
									)}
								</span>
								<span className={'ma-list__body'}>
									<strong>{car.propertyTitle}</strong>
									<small>
										{car.memberData?.memberNick} · <ScheduleIcon /> {moment(car.createdAt).fromNow()}
									</small>
								</span>
								<b className={'ma-list__value'}>${formatterStr(car.propertyPrice)}</b>
							</Link>
						))}
					</div>
				</section>

				<section className={'ma-card'}>
					<header className={'ma-card__head'}>
						<div>
							<h2>{t('Top sellers')}</h2>
							<p>{t('Most cars for sale right now')}</p>
						</div>
					</header>
					{!sellers.length && <div className={'ma-card__empty'}>{t('No cars for sale yet')}</div>}
					<ol className={'ma-rank'}>
						{sellers.map((seller, index) => (
							<li key={seller.memberId}>
								<span className={'ma-rank__place'}>{index + 1}</span>
								<img src={seller.memberImage ? imageUrl(seller.memberImage) : '/img/profile/defaultUser.svg'} alt={''} />
								<span className={'ma-rank__body'}>
									<strong>{seller.memberNick}</strong>
									<small>
										{t(seller.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}
										<span title={t('Views') as string}>
											<RemoveRedEyeOutlinedIcon /> {formatterStr(seller.views)}
										</span>
										<span title={t('Likes') as string}>
											<FavoriteBorderIcon /> {seller.likes}
										</span>
									</small>
								</span>
								<span className={'ma-rank__score'}>
									<b>{seller.cars}</b>
									<small>{t('cars')}</small>
								</span>
							</li>
						))}
					</ol>
				</section>
			</div>

			<section className={'ma-dash__stats'}>
				{STATS.map((item) => (
					<Link key={item.key} href={item.href} className={'ma-mini'}>
						<span>{t(item.label)}</span>
						<strong>{value(item.key)}</strong>
					</Link>
				))}
			</section>
		</div>
	);
};

export default withAdminLayout(AdminHome);
