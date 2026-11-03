import { useTranslation } from 'next-i18next/pages';
import { imageUrl } from '../../../utils';
import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../../apollo/admin/query';
import { CREATE_NOTICE, REMOVE_NOTICE_BY_ADMIN, UPDATE_NOTICE_BY_ADMIN } from '../../../../apollo/admin/mutation';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../sweetAlert';
import { REACT_APP_API_URL } from '../../../config';
import AdminPageHeader from '../AdminPageHeader';
import { T } from '../../../types/common';
import { AddIcon as AddRoundedIcon } from '../../ui/icons';
import Dialog from '../../ui/Dialog';
import { cx } from '../../ui/classNames';
import { AdminField, adminButton, adminInput, AdminPager, AdminSearch, AdminTabs, adminTable, adminTextarea, NoRows, pillTones, PillTone, searchArea, TableScroll, tableWrap, td, tdActions, tdTitle, th, avatar, tr } from '../ui';
import { formatDate } from '../../../date';

/** pill colours, shared with the other admin lists */
const statusTone: Record<string, PillTone> = { ACTIVE: 'success', HOLD: 'warning', DELETE: 'error' };

type Category = 'FAQ' | 'NOTICE' | 'INQUIRY';

interface NoticeManagerProps {
	category: Category;
}

const titles: Record<Category, string> = {
	FAQ: 'FAQ',
	NOTICE: 'Announcements',
	INQUIRY: 'Questions from members',
};

// one sentence under the title: what the page is for and where it shows up
const descriptions: Record<Category, string> = {
	FAQ: 'Answers to common questions, shown in the Support Center. Hidden items stay here but visitors do not see them.',
	NOTICE: 'News and rules for all visitors, shown in the Support Center.',
	INQUIRY: 'Questions members sent from the Support Center. Your answer appears in their account.',
};

// empty list: say what to do instead of "nothing found"
const emptyTexts: Record<Category, string> = {
	FAQ: 'No questions yet. Press "Add" to write the first one.',
	NOTICE: 'No announcements yet. Press "Add" to publish one.',
	INQUIRY: 'No questions from members. New ones appear here and in the menu badge.',
};

// for inquiries HOLD means "waiting for an answer", for FAQ/notices it means "hidden from the site"
const statusLabels = (category: Category): Record<string, string> => ({
	ACTIVE: category === 'INQUIRY' ? 'Answered' : 'Published',
	HOLD: category === 'INQUIRY' ? 'Waiting' : 'Hidden',
	DELETE: 'Deleted',
});

const emptyForm = { _id: '', noticeTitle: '', noticeContent: '', noticeStatus: 'ACTIVE', noticeAnswer: '' };

const NoticeManager = ({ category }: NoticeManagerProps) => {
	const { t } = useTranslation('common');
	const labels = statusLabels(category);
	const isInquiry = category === 'INQUIRY';
	const [status, setStatus] = useState<string>('ALL');
	const [text, setText] = useState<string>('');
	const [page, setPage] = useState<number>(1);
	const [limit, setLimit] = useState<number>(10);
	const [form, setForm] = useState<T | null>(null);

	const input = {
		page,
		limit,
		search: {
			noticeCategory: category,
			...(status !== 'ALL' ? { noticeStatus: status } : {}),
			...(text.trim() ? { text: text.trim() } : {}),
		},
	};

	const { data, loading, refetch } = useQuery<any>(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input },
		notifyOnNetworkStatusChange: true,
	});
	const [createNotice] = useMutation<any>(CREATE_NOTICE);
	const [updateNoticeByAdmin] = useMutation<any>(UPDATE_NOTICE_BY_ADMIN);
	const [removeNoticeByAdmin] = useMutation<any>(REMOVE_NOTICE_BY_ADMIN);

	const list: T[] = data?.getAllNoticesByAdmin?.list ?? [];
	const total: number = data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const saveHandler = async () => {
		if (!form) return;
		try {
			if (isInquiry) {
				await updateNoticeByAdmin({ variables: { input: { _id: form._id, noticeAnswer: form.noticeAnswer.trim() } } });
			} else if (form._id) {
				await updateNoticeByAdmin({
					variables: {
						input: {
							_id: form._id,
							noticeTitle: form.noticeTitle.trim(),
							noticeContent: form.noticeContent.trim(),
							noticeStatus: form.noticeStatus,
						},
					},
				});
			} else {
				await createNotice({
					variables: {
						input: { noticeCategory: category, noticeTitle: form.noticeTitle.trim(), noticeContent: form.noticeContent.trim() },
					},
				});
			}
			setForm(null);
			await refetch({ input });
			await sweetTopSmallSuccessAlert(t('Saved') as string, 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const statusHandler = async (id: string, noticeStatus: string) => {
		try {
			await updateNoticeByAdmin({ variables: { input: { _id: id, noticeStatus } } });
			await refetch({ input });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const removeHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Delete permanently?') as string))) return;
			await removeNoticeByAdmin({ variables: { input: id } });
			await refetch({ input });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const formValid = isInquiry
		? !!form?.noticeAnswer?.trim()
		: (form?.noticeTitle?.trim().length ?? 0) >= 3 && (form?.noticeContent?.trim().length ?? 0) >= 3;

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader
				title={t(titles[category])}
				description={t(descriptions[category]) as string}
				action={
					!isInquiry && (
						<button className={adminButton()} onClick={() => setForm({ ...emptyForm })}>
							<AddRoundedIcon /> {t('Add')}
						</button>
					)
				}
			/>
			<div className={tableWrap}>
				<AdminTabs
					value={status}
					onChange={(item) => {
						setStatus(item);
						setPage(1);
					}}
					items={['ALL', 'ACTIVE', 'HOLD', 'DELETE'].map((item) => ({ value: item, label: item === 'ALL' ? t('All') : t(labels[item]) }))}
				/>
				<div className={searchArea}>
					<AdminSearch
						value={text}
						onChange={(value) => {
							setText(value);
							setPage(1);
						}}
						placeholder={t('Search by title') as string}
					/>
				</div>
				<TableScroll>
					<table className={adminTable}>
						<thead>
							<tr>
								<th className={th}>{t('TITLE')}</th>
								{isInquiry && <th className={th}>{t('WRITER')}</th>}
								<th className={th}>{t('DATE')}</th>
								<th className={cx(th, 'text-center')}>{t('STATUS')}</th>
								<th className={cx(th, 'text-right')}>{t('ACTIONS')}</th>
							</tr>
						</thead>
						<tbody>
							{!list.length && (
								<NoRows colSpan={5}>
									{loading ? t('Loading...') : status === 'ALL' ? t(emptyTexts[category]) : t('No items found')}
								</NoRows>
							)}
							{list.map((item) => (
								<tr key={item._id} className={tr}>
									<td className={cx(td, tdTitle, 'max-w-[420px]')}>
										<strong className="text-[#0f172a]">{item.noticeTitle}</strong>
										<p className="m-0 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-muted">{item.noticeContent}</p>
									</td>
									{isInquiry && (
										<td className={td} data-label={t('WRITER')}>
											<span className="flex items-center gap-2">
												<img
													className={avatar}
													src={item.memberData?.memberImage ? imageUrl(item.memberData.memberImage) : '/img/profile/defaultUser.svg'}
													alt={''}
												/>
												<span>
													{item.memberData?.memberNick ?? '-'}
													<br />
													{/* the same "+998..." format as the Members page */}
													{item.memberData?.memberPhone && <small>+{item.memberData.memberPhone}</small>}
												</span>
											</span>
										</td>
									)}
									<td className={cx(td, 'whitespace-nowrap')} data-label={t('DATE')}>
										{formatDate(item.createdAt, 'DD.MM.YYYY HH:mm')}
									</td>
									<td className={cx(td, 'text-center')} data-label={t('STATUS')}>
										{/* the same coloured status pill as on the Cars and Members pages */}
										<select
											className={cx(
												'h-8 max-w-[200px] min-w-[140px] cursor-pointer rounded-full border-0 px-3 font-sans text-xs font-semibold',
												pillTones[statusTone[item.noticeStatus] ?? 'neutral'],
											)}
											value={item.noticeStatus}
											onChange={(e) => statusHandler(item._id, e.target.value)}
										>
											{['ACTIVE', 'HOLD', 'DELETE'].map((option) => (
												<option key={option} value={option}>
													{t(labels[option])}
												</option>
											))}
										</select>
									</td>
									<td className={cx(td, tdActions, 'text-right')}>
										<span className="flex justify-end gap-2">
											<button
												className={adminButton({ size: 'sm', variant: 'outlined', color: 'primary' })}
												onClick={() =>
													setForm({
														_id: item._id,
														noticeTitle: item.noticeTitle,
														noticeContent: item.noticeContent,
														noticeStatus: item.noticeStatus,
														noticeAnswer: item.noticeAnswer ?? '',
													})
												}
											>
												{isInquiry ? t('Answer') : t('Edit')}
											</button>
											{item.noticeStatus === 'DELETE' && (
												<button className={adminButton({ size: 'sm', variant: 'outlined', color: 'error' })} onClick={() => removeHandler(item._id)}>
													{t('Remove')}
												</button>
											)}
										</span>
									</td>
								</tr>
							))}
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
			<Dialog
				open={!!form}
				onClose={() => setForm(null)}
				title={isInquiry ? t('Answer inquiry') : form?._id ? t('Edit') : t('Add new')}
				actions={
					<>
						<button className={adminButton({ variant: 'text' })} onClick={() => setForm(null)}>
							{t('Cancel')}
						</button>
						<button className={adminButton()} disabled={!formValid} onClick={saveHandler}>
							{t('Save')}
						</button>
					</>
				}
			>
				{isInquiry ? (
					<>
						<p className="m-0 mt-1 font-semibold text-ink">{form?.noticeTitle}</p>
						<p className="m-0 mb-4 text-sm whitespace-pre-line text-muted">{form?.noticeContent}</p>
						<AdminField label={t('Answer')}>
							<textarea
								rows={5}
								className={adminTextarea}
								value={form?.noticeAnswer ?? ''}
								onChange={(e) => setForm({ ...form, noticeAnswer: e.target.value })}
							/>
						</AdminField>
					</>
				) : (
					<div className="mt-1 flex flex-col gap-4">
						<AdminField label={t('Title')}>
							<input
								className={adminInput}
								maxLength={150}
								value={form?.noticeTitle ?? ''}
								onChange={(e) => setForm({ ...form, noticeTitle: e.target.value })}
							/>
						</AdminField>
						<AdminField label={t('Content')}>
							<textarea
								rows={6}
								className={adminTextarea}
								maxLength={5000}
								value={form?.noticeContent ?? ''}
								onChange={(e) => setForm({ ...form, noticeContent: e.target.value })}
							/>
						</AdminField>
						{form?._id && (
							<AdminField label={t('STATUS')}>
								<select
									className={cx(adminInput, 'cursor-pointer')}
									value={form?.noticeStatus ?? 'ACTIVE'}
									onChange={(e) => setForm({ ...form, noticeStatus: e.target.value })}
								>
									{['ACTIVE', 'HOLD', 'DELETE'].map((option) => (
										<option key={option} value={option}>
											{t(labels[option])}
										</option>
									))}
								</select>
							</AdminField>
						)}
					</div>
				)}
			</Dialog>
		</div>
	);
};

export default NoticeManager;
