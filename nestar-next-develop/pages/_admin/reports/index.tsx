import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client';
import {
	Box,
	Button,
	Divider,
	List,
	ListItem,
	Stack,
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
import { GET_REPORTS_BY_ADMIN } from '../../../apollo/admin/query';
import { RESOLVE_REPORT } from '../../../apollo/admin/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { imageUrl } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** complaints about listings: dismiss them or delete the listing */
const AdminReports: NextPage = () => {
	const { t } = useTranslation('common');
	const [status, setStatus] = useState<'OPEN' | 'RESOLVED'>('OPEN');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(10);
	const input = { page, limit, reportStatus: status };
	const { data, loading, refetch } = useQuery(GET_REPORTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input },
		notifyOnNetworkStatusChange: true,
	});
	const [resolveReport] = useMutation(RESOLVE_REPORT);
	const list: T[] = data?.getReportsByAdmin?.list ?? [];
	const total: number = data?.getReportsByAdmin?.metaCounter?.[0]?.total ?? 0;

	const resolveHandler = async (reportId: string, action: 'DISMISS' | 'REMOVE_LISTING') => {
		try {
			if (action === 'REMOVE_LISTING' && !(await sweetConfirmAlert(t('Delete this listing?') as string))) return;
			await resolveReport({ variables: { input: { reportId, action } } });
			await refetch({ input });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('Reports')}
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{(['OPEN', 'RESOLVED'] as const).map((item) => (
						<ListItem
							key={item}
							className={status === item ? 'li on' : 'li'}
							onClick={() => {
								setStatus(item);
								setPage(1);
							}}
						>
							{t(item === 'OPEN' ? 'Open' : 'Resolved')}
						</ListItem>
					))}
				</List>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 820 }}>
						<TableHead>
							<TableRow>
								<TableCell>{t('CAR')}</TableCell>
								<TableCell>{t('REASON')}</TableCell>
								<TableCell>{t('REPORTED BY')}</TableCell>
								<TableCell>{t('DATE')}</TableCell>
								<TableCell align="right">{t('ACTIONS')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{!list.length && (
								<TableRow>
									<TableCell colSpan={5} align="center">
										{loading ? t('Loading...') : t('No reports')}
									</TableCell>
								</TableRow>
							)}
							{list.map((report) => {
								const car = report.propertyData;
								return (
									<TableRow hover key={report._id}>
										<TableCell>
											{car ? (
												<Link href={`/property/detail?id=${car._id}`} target={'_blank'}>
													<Stack direction={'row'} alignItems={'center'} gap={1.5}>
														{car.propertyImages?.[0] && (
															<img
																className={'ma-admin-thumb'}
																src={imageUrl(car.propertyImages[0])}
																alt={''}
																onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
															/>
														)}
														<span>
															<strong>{car.propertyTitle}</strong>
															<Typography variant="caption" display="block" color="text.secondary">
																{t(`status_${car.propertyStatus}`)}
															</Typography>
														</span>
													</Stack>
												</Link>
											) : (
												t('Deleted listing')
											)}
										</TableCell>
										<TableCell>
											<strong>{t(`report_${report.reportReason}`)}</strong>
											{report.reportComment && (
												<Typography variant="body2" color="text.secondary">
													{report.reportComment}
												</Typography>
											)}
										</TableCell>
										<TableCell>{report.memberData?.memberNick ?? '—'}</TableCell>
										<TableCell>{moment(report.createdAt).format('DD.MM.YYYY HH:mm')}</TableCell>
										<TableCell align="right">
											{report.reportStatus === 'OPEN' ? (
												<Stack direction={'row'} gap={1} justifyContent={'flex-end'}>
													<Button size="small" variant="outlined" onClick={() => resolveHandler(report._id, 'DISMISS')}>
														{t('Dismiss')}
													</Button>
													<Button
														size="small"
														color="error"
														variant="contained"
														disabled={!car || car.propertyStatus === 'DELETE'}
														onClick={() => resolveHandler(report._id, 'REMOVE_LISTING')}
													>
														{t('Delete listing')}
													</Button>
												</Stack>
											) : (
												<span>{t('Resolved')}</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					rowsPerPageOptions={[10, 20, 40]}
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

export default withAdminLayout(AdminReports);
