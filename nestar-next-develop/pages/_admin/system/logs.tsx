import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useQuery } from '@apollo/client/react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_ADMIN_LOGS } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';
import { cx } from '../../../libs/components/ui/classNames';
import { AdminPager, AdminTabs, adminTable, NoRows, TableScroll, tableWrap, td, tdTitle, th, tr } from '../../../libs/components/admin/ui';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const TYPES = ['ALL', 'PROPERTY', 'MEMBER', 'REPORT', 'ARTICLE', 'NOTICE', 'COMMENT', 'CHAT', 'SETTINGS'];

/** where the target of an action can be opened */
const targetHref = (log: T): string | null => {
	if (!log.targetId) return null;
	if (log.targetType === 'PROPERTY') return `/property/detail?id=${log.targetId}`;
	if (log.targetType === 'MEMBER') return `/_admin/users/detail?id=${log.targetId}`;
	if (log.targetType === 'ARTICLE') return `/community/detail?id=${log.targetId}`;
	return null;
};

/** who did what and when: every admin action, kept for one year */
const SETTING_LABELS: Record<string, string> = {
	supportPhone: 'Support phone',
	supportEmail: 'Support email',
	telegramUrl: 'Telegram',
	instagramUrl: 'Instagram',
	facebookUrl: 'Facebook',
};

/**
 * Human-readable details: saved settings as "Support phone: …" lines instead of raw JSON,
 * a bare database id as a short "#a1b2c3" tag (the full id stays in the tooltip).
 */
const formatDetails = (details: string | undefined, t: (key: string) => string): React.ReactNode => {
	if (!details) return '—';
	if (/^[a-f0-9]{24}$/.test(details))
		return (
			<code className="rounded-md bg-[#f3f5fa] px-1.5 py-0.5 text-xs text-[#475569]" title={details}>
				#{details.slice(-6)}
			</code>
		);
	if (details.startsWith('{')) {
		try {
			const entries = Object.entries(JSON.parse(details) as Record<string, unknown>);
			return (
				<span className="flex flex-col gap-0.5 [&_b]:font-semibold [&_b]:text-[#475569]">
					{entries.map(([key, value]) => (
						<span key={key}>
							<b>{t(SETTING_LABELS[key] ?? key)}:</b> {String(value ?? '') || '—'}
						</span>
					))}
				</span>
			);
		} catch {
			return details;
		}
	}
	return details;
};

const AdminLogs: NextPage = () => {
	const { t } = useTranslation('common');
	const [type, setType] = useState<string>('ALL');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(20);
	const input: T = { page, limit, ...(type !== 'ALL' && { targetType: type }) };
	const { data, loading } = useQuery<any>(GET_ADMIN_LOGS, { fetchPolicy: 'network-only', variables: { input } });
	const list: T[] = data?.getAdminLogs?.list ?? [];
	const total: number = data?.getAdminLogs?.metaCounter?.[0]?.total ?? 0;

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader title={t('Action log')} description={t('Every action of every admin: who did what and when. Kept for one year.') as string} />
			<div className={tableWrap}>
				<AdminTabs
					className="mb-4"
					value={type}
					onChange={(item) => {
						setType(item);
						setPage(1);
					}}
					items={TYPES.map((item) => ({ value: item, label: t(item === 'ALL' ? 'All' : `log_type_${item}`) }))}
				/>
				<TableScroll>
					<table className={cx(adminTable, 'border-t border-[#edf0f6] md:min-w-[760px]')}>
						<thead>
							<tr>
								<th className={th}>{t('DATE')}</th>
								<th className={th}>{t('ADMIN')}</th>
								<th className={th}>{t('ACTION')}</th>
								<th className={th}>{t('DETAILS')}</th>
							</tr>
						</thead>
						<tbody>
							{!list.length && <NoRows colSpan={4}>{loading ? t('Loading...') : t('No actions yet')}</NoRows>}
							{list.map((log) => {
								const href = targetHref(log);
								return (
									<tr key={log._id} className={tr}>
										<td className={cx(td, 'whitespace-nowrap')} data-label={t('DATE')}>
											{moment(log.createdAt).format('DD.MM.YYYY HH:mm')}
										</td>
										<td className={td} data-label={t('ADMIN')}>
											{log.adminData?.memberNick ?? '—'}
										</td>
										<td className={cx(td, tdTitle, 'text-[#0f172a]')}>
											{href ? (
												<Link href={href} target={'_blank'} className="text-[#1d4ed8]">
													{t(`log_${log.action}`, { defaultValue: log.action })}
												</Link>
											) : (
												t(`log_${log.action}`, { defaultValue: log.action })
											)}
										</td>
										<td className={cx(td, 'max-w-[360px] text-muted')} data-label={t('DETAILS')}>
											{formatDetails(log.details, t)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</TableScroll>
				<AdminPager
					total={total}
					page={page}
					limit={limit}
					options={[20, 50, 100]}
					onPage={setPage}
					onLimit={(value) => {
						setLimit(value);
						setPage(1);
					}}
				/>
			</div>
		</div>
	);
};

export default withAdminLayout(AdminLogs);
