import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useQuery } from '@apollo/client';
import {
	Box,
	Divider,
	List,
	ListItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_ADMIN_LOGS } from '../../../apollo/admin/query';
import { T } from '../../../libs/types/common';

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
			<code className={'ma-admin-id'} title={details}>
				#{details.slice(-6)}
			</code>
		);
	if (details.startsWith('{')) {
		try {
			const entries = Object.entries(JSON.parse(details) as Record<string, unknown>);
			return (
				<span className={'ma-admin-kv'}>
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
	const { data, loading } = useQuery(GET_ADMIN_LOGS, { fetchPolicy: 'network-only', variables: { input } });
	const list: T[] = data?.getAdminLogs?.list ?? [];
	const total: number = data?.getAdminLogs?.metaCounter?.[0]?.total ?? 0;

	return (
		<Box component={'div'} className={'content'}>
			<AdminPageHeader title={t('Action log')} description={t('Every action of every admin: who did what and when. Kept for one year.') as string} />
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{TYPES.map((item) => (
						<ListItem
							key={item}
							className={type === item ? 'li on' : 'li'}
							onClick={() => {
								setType(item);
								setPage(1);
							}}
						>
							{t(item === 'ALL' ? 'All' : `log_type_${item}`)}
						</ListItem>
					))}
				</List>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 760 }} className={'ma-adm-cards'}>
						<TableHead>
							<TableRow>
								<TableCell>{t('DATE')}</TableCell>
								<TableCell>{t('ADMIN')}</TableCell>
								<TableCell>{t('ACTION')}</TableCell>
								<TableCell>{t('DETAILS')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{!list.length && (
								<TableRow>
									<TableCell colSpan={4} align="center">
										{loading ? t('Loading...') : t('No actions yet')}
									</TableCell>
								</TableRow>
							)}
							{list.map((log) => {
								const href = targetHref(log);
								return (
									<TableRow hover key={log._id}>
										<TableCell sx={{ whiteSpace: 'nowrap' }} data-label={t('DATE')}>
											{moment(log.createdAt).format('DD.MM.YYYY HH:mm')}
										</TableCell>
										<TableCell data-label={t('ADMIN')}>{log.adminData?.memberNick ?? '—'}</TableCell>
										<TableCell className={'ma-adm-cards__title'}>
											{href ? (
												<Link href={href} target={'_blank'}>
													{t(`log_${log.action}`, { defaultValue: log.action })}
												</Link>
											) : (
												t(`log_${log.action}`, { defaultValue: log.action })
											)}
										</TableCell>
										<TableCell sx={{ maxWidth: 360, color: 'text.secondary' }} data-label={t('DETAILS')}>
											{formatDetails(log.details, t)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					labelRowsPerPage={t('Rows per page')}
					labelDisplayedRows={({ from, to, count }: any) => `${from}–${to} / ${count}`}
					rowsPerPageOptions={[20, 50, 100]}
					component="div"
					count={total}
					rowsPerPage={limit}
					page={total ? page - 1 : 0}
					onPageChange={(e: unknown, newPage: number) => setPage(newPage + 1)}
					onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => {
						setLimit(parseInt(e.target.value, 10));
						setPage(1);
					}}
				/>
			</Box>
		</Box>
	);
};

export default withAdminLayout(AdminLogs);
