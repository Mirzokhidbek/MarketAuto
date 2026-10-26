import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../../utils';
import React, { useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	InputAdornment,
	List,
	ListItem,
	MenuItem,
	OutlinedInput,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/Search';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../../apollo/admin/query';
import { CREATE_NOTICE, REMOVE_NOTICE_BY_ADMIN, UPDATE_NOTICE_BY_ADMIN } from '../../../../apollo/admin/mutation';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../sweetAlert';
import { REACT_APP_API_URL } from '../../../config';
import { T } from '../../../types/common';

type Category = 'FAQ' | 'NOTICE' | 'INQUIRY';

interface NoticeManagerProps {
	category: Category;
}

const titles: Record<Category, string> = {
	FAQ: 'FAQ Management',
	NOTICE: 'Notice Management',
	INQUIRY: '1:1 Inquiry Management',
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

	const { data, loading, refetch } = useQuery(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input },
		notifyOnNetworkStatusChange: true,
	});
	const [createNotice] = useMutation(CREATE_NOTICE);
	const [updateNoticeByAdmin] = useMutation(UPDATE_NOTICE_BY_ADMIN);
	const [removeNoticeByAdmin] = useMutation(REMOVE_NOTICE_BY_ADMIN);

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
		<Box component={'div'} className={'content'}>
			<Box component={'div'} className={'title flex_space'}>
				<Typography variant={'h2'}>{t(titles[category])}</Typography>
				{!isInquiry && (
					<Button className="btn_add" variant={'contained'} size={'medium'} onClick={() => setForm({ ...emptyForm })}>
						<AddRoundedIcon sx={{ mr: '8px' }} />
						{t('ADD')}
					</Button>
				)}
			</Box>
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{['ALL', 'ACTIVE', 'HOLD', 'DELETE'].map((item) => (
						<ListItem
							key={item}
							className={status === item ? 'li on' : 'li'}
							onClick={() => {
								setStatus(item);
								setPage(1);
							}}
						>
							{item === 'ALL' ? t('All') : t(labels[item])}
						</ListItem>
					))}
				</List>
				<Divider />
				<Stack className={'search-area'} sx={{ m: '24px' }}>
					<OutlinedInput
						value={text}
						onChange={(e) => {
							setText(e.target.value);
							setPage(1);
						}}
						sx={{ width: '100%' }}
						className={'search'}
						placeholder={t('Search by title') as string}
						endAdornment={
							<InputAdornment position="end">
								<SearchIcon />
							</InputAdornment>
						}
					/>
				</Stack>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 750 }} size={'medium'}>
						<TableHead>
							<TableRow>
								<TableCell>{t('TITLE')}</TableCell>
								{isInquiry && <TableCell>{t('WRITER')}</TableCell>}
								<TableCell>{t('DATE')}</TableCell>
								<TableCell align="center">{t('STATUS')}</TableCell>
								<TableCell align="right">{t('ACTIONS')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{!list.length && (
								<TableRow>
									<TableCell colSpan={5} align="center">
										{loading ? t('Loading...') : t('No items found')}
									</TableCell>
								</TableRow>
							)}
							{list.map((item) => (
								<TableRow hover key={item._id}>
									<TableCell sx={{ maxWidth: 420 }}>
										<strong>{item.noticeTitle}</strong>
										<Typography variant="body2" color="text.secondary" noWrap>
											{item.noticeContent}
										</Typography>
									</TableCell>
									{isInquiry && (
										<TableCell>
											<Stack direction="row" alignItems="center" gap={1}>
												<img
													className={'ma-admin-avatar'}
													src={
														item.memberData?.memberImage
															? imageUrl(item.memberData.memberImage)
															: '/img/profile/defaultUser.svg'
													}
													alt={''}
												/>
												<span>
													{item.memberData?.memberNick ?? '-'}
													<br />
													<small>{item.memberData?.memberPhone}</small>
												</span>
											</Stack>
										</TableCell>
									)}
									<TableCell>{moment(item.createdAt).format('DD.MM.YYYY HH:mm')}</TableCell>
									<TableCell align="center">
										<Select
											size="small"
											value={item.noticeStatus}
											onChange={(e) => statusHandler(item._id, e.target.value as string)}
										>
											{['ACTIVE', 'HOLD', 'DELETE'].map((option) => (
												<MenuItem key={option} value={option}>
													{t(labels[option])}
												</MenuItem>
											))}
										</Select>
									</TableCell>
									<TableCell align="right">
										<Stack direction="row" gap={1} justifyContent="flex-end">
											<Button
												size="small"
												variant="outlined"
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
											</Button>
											{item.noticeStatus === 'DELETE' && (
												<Button size="small" color="error" variant="outlined" onClick={() => removeHandler(item._id)}>
													{t('Remove')}
												</Button>
											)}
										</Stack>
									</TableCell>
								</TableRow>
							))}
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

			<Dialog open={!!form} onClose={() => setForm(null)} fullWidth maxWidth="sm">
				<DialogTitle>{isInquiry ? t('Answer inquiry') : form?._id ? t('Edit') : t('Add new')}</DialogTitle>
				<DialogContent>
					{isInquiry ? (
						<>
							<Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
								{form?.noticeTitle}
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
								{form?.noticeContent}
							</Typography>
							<TextField
								label={t('Answer')}
								multiline
								minRows={5}
								fullWidth
								value={form?.noticeAnswer ?? ''}
								onChange={(e) => setForm({ ...form, noticeAnswer: e.target.value })}
							/>
						</>
					) : (
						<Stack gap={2} sx={{ mt: 1 }}>
							<TextField
								label={t('Title')}
								fullWidth
								inputProps={{ maxLength: 150 }}
								value={form?.noticeTitle ?? ''}
								onChange={(e) => setForm({ ...form, noticeTitle: e.target.value })}
							/>
							<TextField
								label={t('Content')}
								multiline
								minRows={6}
								fullWidth
								inputProps={{ maxLength: 5000 }}
								value={form?.noticeContent ?? ''}
								onChange={(e) => setForm({ ...form, noticeContent: e.target.value })}
							/>
							{form?._id && (
								<Select
									value={form?.noticeStatus ?? 'ACTIVE'}
									onChange={(e) => setForm({ ...form, noticeStatus: e.target.value })}
								>
									{['ACTIVE', 'HOLD', 'DELETE'].map((option) => (
										<MenuItem key={option} value={option}>
											{t(labels[option])}
										</MenuItem>
									))}
								</Select>
							)}
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setForm(null)}>{t('Cancel')}</Button>
					<Button variant="contained" disabled={!formValid} onClick={saveHandler}>
						{t('Save')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default NoticeManager;
