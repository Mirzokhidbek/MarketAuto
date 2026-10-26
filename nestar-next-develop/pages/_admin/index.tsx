import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import moment from 'moment';
import { Box, Typography } from '@mui/material';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import DailyColumns from '../../libs/components/admin/DailyColumns';
import { GET_ALL_PROPERTIES_BY_ADMIN, GET_DASHBOARD_STATS, GET_REPORTS_BY_ADMIN } from '../../apollo/admin/query';
import { formatterStr, imageUrl } from '../../libs/utils';
import { T } from '../../libs/types/common';

const cards = [
	{ key: 'membersTotal', label: 'Members', hint: 'registered (excluding admins)', href: '/_admin/users' },
	{ key: 'membersToday', label: 'New members today', hint: 'signed up since 00:00', href: '/_admin/users' },
	{ key: 'dealers', label: 'Dealers', hint: 'active dealer accounts', href: '/_admin/users' },
	{ key: 'membersBlocked', label: 'Blocked members', hint: 'cannot log in or post', href: '/_admin/users', warn: true },
	{ key: 'carsActive', label: 'Cars for sale', hint: 'active listings', href: '/_admin/properties' },
	{ key: 'carsToday', label: 'New cars today', hint: 'listed since 00:00', href: '/_admin/properties' },
	{ key: 'carsSold', label: 'Sold cars', hint: 'marked as sold', href: '/_admin/properties' },
	{ key: 'carsDeleted', label: 'Deleted cars', hint: 'can be restored or removed', href: '/_admin/properties' },
	{ key: 'articlesActive', label: 'Articles', hint: 'published in community', href: '/_admin/community' },
	{ key: 'inquiriesWaiting', label: 'Open inquiries', hint: 'waiting for an answer', href: '/_admin/cs/inquiry', warn: true },
	{ key: 'carsPending', label: 'Cars to review', hint: 'new sellers waiting for approval', href: '/_admin/properties?status=PENDING', warn: true },
	{ key: 'reportsOpen', label: 'Open reports', hint: 'complaints about listings', href: '/_admin/reports', warn: true },
];


export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminHome: NextPage = () => {
	const { t } = useTranslation('common');
	const { data, loading } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'network-only', pollInterval: 60000 });
	const stats: T = data?.getDashboardStats ?? {};
	const daily: T[] = stats.daily ?? [];
	// the work queue: newest cars waiting for review and open complaints
	const { data: pendingData } = useQuery(GET_ALL_PROPERTIES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 5, sort: 'createdAt', direction: 'ASC', search: { propertyStatus: 'PENDING' } } },
	});
	const { data: reportsData } = useQuery(GET_REPORTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 5, reportStatus: 'OPEN' } },
	});
	const pending: T[] = pendingData?.getAllPropertiesByAdmin?.list ?? [];
	const reports: T[] = reportsData?.getReportsByAdmin?.list ?? [];

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('Dashboard')}
			</Typography>
			<div className={'ma-admin-stats'}>
				{cards.map((card) => (
					<Link href={card.href} key={card.key}>
						<div className={`ma-admin-stat ${card.warn && stats[card.key] > 0 ? 'is-warn' : ''}`}>
							<span>{t(card.label)}</span>
							<strong>{loading && stats[card.key] === undefined ? '…' : stats[card.key] ?? 0}</strong>
							<em>{t(card.hint)}</em>
						</div>
					</Link>
				))}
			</div>

			{daily.length > 0 && (
				<div className={'ma-admin-grid'}>
					<DailyColumns
						title={t('New cars per day')}
						total={t('last 14 days') as string}
						points={daily.map((day) => ({ date: day.date, value: day.cars }))}
					/>
					<DailyColumns
						title={t('New members per day')}
						total={t('last 14 days') as string}
						points={daily.map((day) => ({ date: day.date, value: day.members }))}
					/>
				</div>
			)}

			<div className={'ma-admin-grid'}>
				<section className={'ma-admin-card'}>
					<header className={'ma-admin-card__head'}>
						<h3>{t('Cars to review')}</h3>
						<Link href={'/_admin/properties?status=PENDING'}>{t('See all')} →</Link>
					</header>
					{!pending.length && <p className={'ma-admin-card__empty'}>{t('Nothing waiting. Good job!')}</p>}
					{pending.map((car) => (
						<Link key={car._id} href={'/_admin/properties?status=PENDING'} className={'ma-admin-row'}>
							{car.propertyImages?.[0] ? (
								<img className={'ma-admin-thumb'} src={imageUrl(car.propertyImages[0])} alt={''} />
							) : (
								<span className={'ma-admin-thumb'} />
							)}
							<span>
								<strong>{car.propertyTitle}</strong>
								<small>
									${formatterStr(car.propertyPrice)} · {car.memberData?.memberNick} · {moment(car.createdAt).fromNow()}
								</small>
							</span>
						</Link>
					))}
				</section>
				<section className={'ma-admin-card'}>
					<header className={'ma-admin-card__head'}>
						<h3>{t('Open reports')}</h3>
						<Link href={'/_admin/reports'}>{t('See all')} →</Link>
					</header>
					{!reports.length && <p className={'ma-admin-card__empty'}>{t('No reports')}</p>}
					{reports.map((report) => (
						<Link key={report._id} href={'/_admin/reports'} className={'ma-admin-row'}>
							<span>
								<strong>{report.propertyData?.propertyTitle ?? t('Deleted listing')}</strong>
								<small>
									{t(`report_${report.reportReason}`)} · {report.memberData?.memberNick ?? '—'} · {moment(report.createdAt).fromNow()}
								</small>
							</span>
						</Link>
					))}
				</section>
			</div>
		</Box>
	);
};

export default withAdminLayout(AdminHome);
