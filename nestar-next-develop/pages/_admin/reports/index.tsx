import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client/react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_REPORTS_BY_ADMIN } from '../../../apollo/admin/query';
import { RESOLVE_REPORT } from '../../../apollo/admin/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { imageUrl } from '../../../libs/utils';
import { T } from '../../../libs/types/common';
import { cx } from '../../../libs/components/ui/classNames';
import { adminButton, AdminPager, AdminTabs, adminTable, caption, NoRows, TableScroll, tableWrap, td, tdActions, tdTitle, th, thumb, tr } from '../../../libs/components/admin/ui';

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
	const { data, loading, refetch } = useQuery<any>(GET_REPORTS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input },
		notifyOnNetworkStatusChange: true,
	});
	const [resolveReport] = useMutation<any>(RESOLVE_REPORT);
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
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader title={t('Reports')} description={t('Complaints from buyers about listings. Close the report if the car is fine, or delete the listing.') as string} />
			<div className={tableWrap}>
				<AdminTabs
					className="mb-4"
					value={status}
					onChange={(item) => {
						setStatus(item);
						setPage(1);
					}}
					items={(['OPEN', 'RESOLVED'] as const).map((item) => ({ value: item, label: t(item === 'OPEN' ? 'Unresolved' : 'Resolved') }))}
				/>
				<TableScroll>
					<table className={cx(adminTable, 'border-t border-[#edf0f6] md:min-w-[820px]')}>
						<thead>
							<tr>
								<th className={th}>{t('CAR')}</th>
								<th className={th}>{t('REASON')}</th>
								<th className={th}>{t('REPORTED BY')}</th>
								<th className={th}>{t('DATE')}</th>
								<th className={cx(th, 'text-right')}>{t('ACTIONS')}</th>
							</tr>
						</thead>
						<tbody>
							{!list.length && <NoRows colSpan={5}>{loading ? t('Loading...') : t('No reports')}</NoRows>}
							{list.map((report) => {
								const car = report.propertyData;
								return (
									<tr key={report._id} className={tr}>
										<td className={cx(td, tdTitle)}>
											{car ? (
												<Link href={`/property/detail?id=${car._id}`} target={'_blank'} className="flex items-center gap-3">
													{car.propertyImages?.[0] && (
														<img
															className={thumb}
															src={imageUrl(car.propertyImages[0])}
															alt={''}
															onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
														/>
													)}
													<span>
														<strong className="text-[#0f172a]">{car.propertyTitle}</strong>
														<span className={caption}>{t(`status_${car.propertyStatus}`)}</span>
													</span>
												</Link>
											) : (
												t('Deleted listing')
											)}
										</td>
										<td className={td} data-label={t('REASON')}>
											<strong className="text-[#0f172a]">{t(`report_${report.reportReason}`)}</strong>
											{report.reportComment && <p className="m-0 text-sm text-muted">{report.reportComment}</p>}
										</td>
										<td className={td} data-label={t('REPORTED BY')}>
											{report.memberData?.memberNick ?? '—'}
										</td>
										<td className={cx(td, 'whitespace-nowrap')} data-label={t('DATE')}>
											{moment(report.createdAt).format('DD.MM.YYYY HH:mm')}
										</td>
										<td className={cx(td, tdActions, 'text-right')}>
											{report.reportStatus === 'OPEN' ? (
												<span className="flex justify-end gap-2">
													{/* "Reject" on the Cars page rejects a listing; here the complaint is closed and the car stays */}
													<button
														className={adminButton({ size: 'sm', variant: 'outlined', color: 'primary' })}
														title={t('The listing is fine: close the report and keep the car') as string}
														onClick={() => resolveHandler(report._id, 'DISMISS')}
													>
														{t('Close report')}
													</button>
													<button
														className={adminButton({ size: 'sm', color: 'error' })}
														disabled={!car || car.propertyStatus === 'DELETE'}
														onClick={() => resolveHandler(report._id, 'REMOVE_LISTING')}
													>
														{t('Delete listing')}
													</button>
												</span>
											) : (
												<span>{t('Resolved')}</span>
											)}
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
					options={[10, 20, 40]}
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

export default withAdminLayout(AdminReports);
