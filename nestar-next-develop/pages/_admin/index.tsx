import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import TrendChart from '../../libs/components/admin/TrendChart';
import { GET_ALL_PROPERTIES_BY_ADMIN, GET_DASHBOARD_STATS } from '../../apollo/admin/query';
import { userVar } from '../../apollo/store';
import { formatterStr, imageUrl } from '../../libs/utils';
import { T } from '../../libs/types/common';
import { CarIcon as DirectionsCarFilledOutlinedIcon, FlagIcon as OutlinedFlagIcon, ForumIcon as ForumOutlinedIcon, ChevronRightIcon, EyeIcon as RemoveRedEyeOutlinedIcon, FavoriteBorderIcon, ScheduleIcon } from '../../libs/components/ui/icons';
import { cx } from '../../libs/components/ui/classNames';
import { AdminCard, CardHead, cardEmpty } from '../../libs/components/admin/ui';
import { fromNow } from '../../libs/date';

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

const TASK_TONES: Record<string, { card: string; icon: string }> = {
	violet: { card: 'bg-[#f1edff]', icon: 'bg-[#7c5cff]' },
	blue: { card: 'bg-[#e9f2ff]', icon: 'bg-[#2a78d6]' },
	green: { card: 'bg-[#e7f6ec]', icon: 'bg-[#22a35a]' },
};
const raised = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)]';

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
	const { data, loading } = useQuery<any>(GET_DASHBOARD_STATS, {
		fetchPolicy: 'cache-and-network',
		variables: { days },
		pollInterval: 60000,
	});
	const stats: T = data?.getDashboardStats ?? {};
	const daily: T[] = stats.daily ?? [];
	const sellers: T[] = stats.topSellers ?? [];
	const { data: pendingData } = useQuery<any>(GET_ALL_PROPERTIES_BY_ADMIN, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 4, sort: 'createdAt', direction: 'ASC', search: { propertyStatus: 'PENDING' } } },
	});
	const pending: T[] = pendingData?.getAllPropertiesByAdmin?.list ?? [];
	const hello = greeting();
	const waitingTotal = TODO.reduce((sum, item) => sum + (stats[item.key] ?? 0), 0);
	const value = (key: string) => (loading && stats[key] === undefined ? '…' : stats[key] ?? 0);

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<header className="mt-3 mb-[26px] flex items-center gap-4">
				<span className="text-[32px] leading-none md:text-[40px]" aria-hidden="true">
					{hello.icon}
				</span>
				<div>
					<h1 className="m-0 text-[26px] leading-[1.15] font-extrabold tracking-[-0.02em] text-[#0f172a] md:text-[34px]">
						{t(hello.text)}, {user.memberNick}!
					</h1>
					<p className="m-0 mt-1.5 text-[15px] text-faint">
						{waitingTotal > 0
							? t('Waiting for you today: {{count}}', { count: waitingTotal })
							: t('Nothing is waiting. Everything is checked.')}
					</p>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
				<AdminCard>
					<CardHead title={t('Needs attention')} text={t('Start the day here')} />
					<div className="flex flex-col gap-3.5">
						{TODO.map((item) => {
							const count: number = stats[item.key] ?? 0;
							return (
								<Link
									key={item.key}
									href={item.href}
									className={cx(
										'relative grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[20px] p-3.5 text-[#0f172a] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)] min-[481px]:grid-cols-[48px_minmax(0,1fr)_auto_18px] min-[481px]:p-[18px]',
										TASK_TONES[item.tone].card,
									)}
								>
									<span className={cx('flex size-11 items-center justify-center rounded-[14px] text-white min-[481px]:size-12', TASK_TONES[item.tone].icon)}>
										{item.icon}
									</span>
									<span className="flex min-w-0 flex-col gap-1 [overflow-wrap:anywhere]">
										<strong className="text-base">{t(item.label)}</strong>
										<em className="text-xs leading-[1.45] text-[#475569] not-italic">{t(item.desc)}</em>
									</span>
									<span className={cx('text-[28px]', count ? 'font-extrabold' : 'font-semibold text-faint')}>{value(item.key)}</span>
									<ChevronRightIcon className="text-faint max-[480px]:hidden" />
								</Link>
							);
						})}
					</div>
				</AdminCard>
				<AdminCard>
					<CardHead
						title={t('Activity')}
						text={t('New cars and new members per day')}
						action={
							<div className="inline-flex rounded-full border border-[#edf0f6] p-1" role={'group'} aria-label={t('Period') as string}>
								{PERIODS.map((period) => (
									<button
										key={period}
										className={cx(
											'cursor-pointer rounded-full border-0 px-3 py-1.5 font-sans text-xs font-semibold whitespace-nowrap',
											days === period ? 'bg-[#0f172a] text-white' : 'bg-transparent text-faint',
										)}
										aria-pressed={days === period}
										onClick={() => setDays(period)}
									>
										{t('{{count}} days', { count: period })}
									</button>
								))}
							</div>
						}
					/>
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
						<div className={cardEmpty}>{t('Loading...')}</div>
					)}
				</AdminCard>
			</div>

			<div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
				<AdminCard>
					<CardHead
						title={t('Cars to review')}
						text={t('Oldest first: they have waited the longest')}
						action={
							<Link
								href={'/_admin/properties?status=PENDING'}
								className="rounded-full border border-[#edf0f6] px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-[#475569] hover:bg-[#f3f5fa] hover:text-[#0f172a]"
							>
								{t('See all')}
							</Link>
						}
					/>
					{!pending.length && <div className={cardEmpty}>✓ {t('Nothing waiting. Good job!')}</div>}
					<div className="flex flex-col gap-1.5">
						{pending.map((car) => (
							<Link
								key={car._id}
								href={'/_admin/properties?status=PENDING'}
								className="-mx-2.5 flex items-center gap-3.5 rounded-2xl p-2.5 text-[#0f172a] hover:bg-[#f3f5fa]"
							>
								<span className="flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#0f172a] text-white">
									{car.propertyImages?.[0] ? (
										<img
											src={imageUrl(car.propertyImages[0])}
											alt={''}
											className="size-full object-cover"
											onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
										/>
									) : (
										<DirectionsCarFilledOutlinedIcon />
									)}
								</span>
								<span className="flex min-w-0 flex-1 flex-col gap-1">
									<strong className="overflow-hidden text-sm font-semibold text-ellipsis whitespace-nowrap">{car.propertyTitle}</strong>
									<small className="flex items-center gap-1 text-xs text-faint [&_svg]:text-sm">
										{car.memberData?.memberNick} · <ScheduleIcon /> {fromNow(car.createdAt)}
									</small>
								</span>
								<b className="text-[15px] font-bold whitespace-nowrap min-[481px]:text-lg">${formatterStr(car.propertyPrice)}</b>
							</Link>
						))}
					</div>
				</AdminCard>
				<AdminCard>
					<CardHead title={t('Top sellers')} text={t('Most cars for sale right now')} />
					{!sellers.length && <div className={cardEmpty}>{t('No cars for sale yet')}</div>}
					<ol className="m-0 flex list-none flex-col gap-1.5 p-0">
						{sellers.map((seller, index) => (
							<li key={seller.memberId} className="flex items-center gap-3.5 border-b border-[#edf0f6] py-2.5 last:border-b-0">
								<span className="w-[18px] text-center text-[13px] font-bold text-faint">{index + 1}</span>
								<img
									src={seller.memberImage ? imageUrl(seller.memberImage) : '/img/profile/defaultUser.svg'}
									alt={''}
									className="size-[46px] rounded-full bg-[#f3f5fa] object-cover"
								/>
								<span className="flex min-w-0 flex-1 flex-col gap-1">
									<strong className="text-[15px]">{seller.memberNick}</strong>
									<small className="flex items-center gap-3 text-xs text-faint [&_span]:inline-flex [&_span]:items-center [&_span]:gap-[3px] [&_svg]:text-sm">
										{t(seller.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}
										<span title={t('Views') as string}>
											<RemoveRedEyeOutlinedIcon /> {formatterStr(seller.views)}
										</span>
										<span title={t('Likes') as string}>
											<FavoriteBorderIcon /> {seller.likes}
										</span>
									</small>
								</span>
								<span className="flex flex-col items-end">
									<b className="text-[26px] leading-none font-bold">{seller.cars}</b>
									<small className="text-[11px] text-faint">{t('cars')}</small>
								</span>
							</li>
						))}
					</ol>
				</AdminCard>
			</div>

			<section className="mt-5 grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
				{STATS.map((item) => (
					<Link key={item.key} href={item.href} className={cx('group flex flex-col gap-1.5 rounded-[18px] bg-white px-[18px] py-4 text-[#0f172a]', raised)}>
						<span className="text-xs font-semibold text-faint">{t(item.label)}</span>
						<strong className="text-2xl font-extrabold group-hover:text-[#1d4ed8]">{value(item.key)}</strong>
					</Link>
				))}
			</section>
		</div>
	);
};

export default withAdminLayout(AdminHome);
