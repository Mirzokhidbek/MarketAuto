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
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
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
			<AdminPageHeader title={t('Reports')} description={t('Complaints from buyers about listings. Close the report if the car is fine, or delete the listing.') as string} />
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
							{t(item === 'OPEN' ? 'Unresolved' : 'Resolved')}
						</ListItem>
					))}
				</List>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 820 }} className={'ma-adm-cards'}>
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
										<TableCell className={'ma-adm-cards__title'}>
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
										<TableCell data-label={t('REASON')}>
											<strong>{t(`report_${report.reportReason}`)}</strong>
											{report.reportComment && (
												<Typography variant="body2" color="text.secondary">
													{report.reportComment}
												</Typography>
											)}
										</TableCell>
										<TableCell data-label={t('REPORTED BY')}>{report.memberData?.memberNick ?? '—'}</TableCell>
										<TableCell data-label={t('DATE')}>{moment(report.createdAt).format('DD.MM.YYYY HH:mm')}</TableCell>
										<TableCell align="right" className={'ma-adm-cards__actions'}>
											{report.reportStatus === 'OPEN' ? (
												<Stack direction={'row'} gap={1} justifyContent={'flex-end'}>
													{/* "Reject" on the Cars page rejects a listing; here the complaint is closed and the car stays */}
													<Button
														size="small"
														variant="outlined"
														sx={{ whiteSpace: 'nowrap' }}
														title={t('The listing is fine: close the report and keep the car') as string}
														onClick={() => resolveHandler(report._id, 'DISMISS')}
													>
														{t('Close report')}
													</Button>
													<Button
														size="small"
														color="error"
														variant="contained"
														sx={{ whiteSpace: 'nowrap' }}
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
					labelRowsPerPage={t('Rows per page')}
					labelDisplayedRows={({ from, to, count }: any) => `${from}–${to} / ${count}`}
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
