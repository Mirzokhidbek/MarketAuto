import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Skeleton } from '@mui/material';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { GET_ADMIN_WAITING } from '../../../apollo/admin/query';
import { imageUrl } from '../../utils';
import { T } from '../../types/common';

interface AdminWaitingPanelProps {
	counts: { carsPending?: number; reportsOpen?: number; inquiriesWaiting?: number };
	onNavigate: () => void;
}

const PREVIEW = 3;

/**
 * The admin bell: what waits for a decision, oldest first, so nothing sits forgotten.
 * Each section shows its count, the oldest items and a link to the full list.
 */
const AdminWaitingPanel = ({ counts, onNavigate }: AdminWaitingPanelProps) => {
	const { t } = useTranslation('common');
	const oldestFirst = { page: 1, limit: PREVIEW };
	const { data, loading } = useQuery(GET_ADMIN_WAITING, {
		fetchPolicy: 'network-only',
		variables: {
			cars: { ...oldestFirst, sort: 'createdAt', direction: 'ASC', search: { propertyStatus: 'PENDING' } },
			reports: { ...oldestFirst, reportStatus: 'OPEN' },
			inquiries: { ...oldestFirst, search: { noticeCategory: 'INQUIRY', noticeStatus: 'HOLD' } },
		},
	});

	const sections = [
		{
			key: 'cars',
			title: 'Cars to review',
			icon: <DirectionsCarFilledRoundedIcon />,
			tone: 'violet',
			count: counts.carsPending ?? 0,
			href: '/_admin/properties?status=PENDING',
			rows: (data?.getAllPropertiesByAdmin?.list ?? []).map((car: T) => ({
				id: car._id,
				image: car.propertyImages?.[0],
				title: car.propertyTitle,
				meta: car.memberData?.memberNick,
				at: car.createdAt,
				href: `/property/detail?id=${car._id}`,
			})),
		},
		{
			key: 'reports',
			title: 'Open reports',
			icon: <FlagRoundedIcon />,
			tone: 'red',
			count: counts.reportsOpen ?? 0,
			href: '/_admin/reports',
			rows: (data?.getReportsByAdmin?.list ?? []).map((report: T) => ({
				id: report._id,
				image: report.propertyData?.propertyImages?.[0],
				title: report.propertyData?.propertyTitle ?? t('Deleted listing'),
				meta: `${t(`report_${report.reportReason}`)} · ${report.memberData?.memberNick ?? '—'}`,
				at: report.createdAt,
				href: '/_admin/reports',
			})),
		},
		{
			key: 'inquiries',
			title: 'Questions from members',
			icon: <QuestionAnswerRoundedIcon />,
			tone: 'blue',
			count: counts.inquiriesWaiting ?? 0,
			href: '/_admin/cs/inquiry',
			rows: (data?.getAllNoticesByAdmin?.list ?? []).map((item: T) => ({
				id: item._id,
				image: item.memberData?.memberImage,
				avatar: true,
				title: item.noticeTitle,
				meta: item.memberData?.memberNick,
				at: item.createdAt,
				href: '/_admin/cs/inquiry',
			})),
		},
	];
	const total = sections.reduce((sum, section) => sum + section.count, 0);

	return (
		<div className={'ma-adm-wait'}>
			<div className={'ma-adm-wait__head'}>
				<strong>{t('Waiting work')}</strong>
				<span className={total ? 'is-hot' : ''}>{total ? t('{{count}} items', { count: total }) : t('All done')}</span>
			</div>

			{!total && !loading ? (
				<div className={'ma-adm-wait__done'}>
					<TaskAltRoundedIcon />
					<strong>{t('Nothing is waiting')}</strong>
					<span>{t('New cars, reports and questions will appear here.')}</span>
				</div>
			) : (
				sections.map((section) => (
					<section key={section.key} className={`ma-adm-wait__section ma-adm-wait--${section.tone}`}>
						<Link href={section.href} className={'ma-adm-wait__title'} onClick={onNavigate}>
							<span className={'ma-adm-wait__icon'}>{section.icon}</span>
							<span>{t(section.title)}</span>
							<b className={section.count ? 'is-hot' : ''}>{section.count}</b>
							<em>{t('Open')} →</em>
						</Link>
						{loading && section.count > 0 && !section.rows.length && (
							<Skeleton variant="rounded" height={44} sx={{ mx: '14px', mb: 1 }} />
						)}
						{section.rows.map((row: T) => (
							<Link key={row.id} href={row.href} className={'ma-adm-wait__row'} onClick={onNavigate}>
								{row.image ? (
									<img className={row.avatar ? 'is-avatar' : ''} src={imageUrl(row.image)} alt={''} />
								) : (
									<span className={`ma-adm-wait__ph ${row.avatar ? 'is-avatar' : ''}`} />
								)}
								<span className={'ma-adm-wait__text'}>
									<strong>{row.title}</strong>
									<small>{row.meta}</small>
								</span>
								<time dateTime={row.at} title={moment(row.at).format('DD.MM.YYYY HH:mm')}>
									{moment(row.at).fromNow()}
								</time>
							</Link>
						))}
					</section>
				))
			)}
		</div>
	);
};

export default AdminWaitingPanel;
