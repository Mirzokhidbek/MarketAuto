import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next/pages';
import { useQuery } from '@apollo/client/react';
import { Skeleton } from '../ui/Feedback';
import { cx } from '../ui/classNames';
import { GET_ADMIN_WAITING } from '../../../apollo/admin/query';
import { imageUrl } from '../../utils';
import { T } from '../../types/common';
import { CarFilledIcon as DirectionsCarFilledRoundedIcon, FlagIcon as FlagRoundedIcon, ForumIcon as QuestionAnswerRoundedIcon, CheckCircleIcon as TaskAltRoundedIcon } from '../ui/icons';

interface AdminWaitingPanelProps {
	counts: { carsPending?: number; reportsOpen?: number; inquiriesWaiting?: number };
	onNavigate: () => void;
}

const PREVIEW = 3;

const TONES: Record<string, string> = {
	violet: 'bg-[#7c3aed]/12 text-[#7c3aed]',
	red: 'bg-[#dc2626]/12 text-[#dc2626]',
	blue: 'bg-[#1d4ed8]/12 text-[#1d4ed8]',
};
const preview = 'h-7 w-9 shrink-0 rounded-[7px] bg-[#edf0f6] object-cover';

/**
 * The admin bell: what waits for a decision, oldest first, so nothing sits forgotten.
 * Each section shows its count, the oldest items and a link to the full list.
 */
const AdminWaitingPanel = ({ counts, onNavigate }: AdminWaitingPanelProps) => {
	const { t } = useTranslation('common');
	const oldestFirst = { page: 1, limit: PREVIEW };
	const { data, loading } = useQuery<any>(GET_ADMIN_WAITING, {
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
		<div className="pb-2 font-sans">
			<div className="sticky top-0 z-[1] flex items-center justify-between border-b border-[#edf0f6] bg-white/96 px-[18px] pt-4 pb-3 backdrop-blur-[4px]">
				<strong className="text-[15px] text-[#0f172a]">{t('Waiting work')}</strong>
				<span
					className={cx(
						'rounded-full px-2.5 py-[3px] text-xs font-bold',
						total ? 'bg-[#fdecec] text-[#b42318]' : 'bg-[#e8f7ee] text-[#127a46]',
					)}
				>
					{total ? t('{{count}} items', { count: total }) : t('All done')}
				</span>
			</div>
			{!total && !loading ? (
				<div className="flex flex-col items-center gap-1.5 px-6 py-8 text-center text-[13px] text-faint">
					<TaskAltRoundedIcon className="size-12 rounded-full bg-[#e8f7ee] p-2.5 text-[#127a46]" />
					<strong className="text-[15px] text-[#0f172a]">{t('Nothing is waiting')}</strong>
					<span>{t('New cars, reports and questions will appear here.')}</span>
				</div>
			) : (
				sections.map((section) => (
					<section key={section.key} className="pt-2 pb-1 [&+&]:border-t [&+&]:border-[#edf0f6]">
						<Link
							href={section.href}
							className="mx-2 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f3f5fa]"
							onClick={onNavigate}
						>
							<span className={cx('flex size-[30px] items-center justify-center rounded-[10px] [&_svg]:text-lg', TONES[section.tone])}>
								{section.icon}
							</span>
							<span>{t(section.title)}</span>
							<b
								className={cx(
									'min-w-6 rounded-full px-[7px] text-center text-xs leading-[22px]',
									section.count ? 'bg-[#dc2626] text-white' : 'bg-[#edf0f6] text-faint',
								)}
							>
								{section.count}
							</b>
							<em className="ml-auto text-[12.5px] font-semibold text-[#1d4ed8] not-italic">{t('Open')} →</em>
						</Link>
						{loading && section.count > 0 && !section.rows.length && <Skeleton className="mx-3.5 mb-2 h-11 rounded-lg" />}
						{section.rows.map((row: T) => (
							<Link
								key={row.id}
								href={row.href}
								className="mx-2 flex items-center gap-2.5 rounded-xl py-[7px] pr-2.5 pl-[50px] hover:bg-[#f3f5fa]"
								onClick={onNavigate}
							>
								{row.image ? (
									<img className={cx(preview, row.avatar && 'w-7 rounded-full')} src={imageUrl(row.image)} alt={''} />
								) : (
									<span className={cx(preview, row.avatar && 'w-7 rounded-full')} />
								)}
								<span className="flex min-w-0 flex-1 flex-col [&>*]:overflow-hidden [&>*]:text-ellipsis [&>*]:whitespace-nowrap">
									<strong className="text-[13px] font-semibold text-[#0f172a]">{row.title}</strong>
									<small className="text-xs text-faint">{row.meta}</small>
								</span>
								<time className="shrink-0 text-[11.5px] text-faint" dateTime={row.at} title={moment(row.at).format('DD.MM.YYYY HH:mm')}>
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
