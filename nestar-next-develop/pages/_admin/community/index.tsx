import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Box,
	Button,
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
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_ALL_BOARD_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { REMOVE_BOARD_ARTICLE_BY_ADMIN, UPDATE_BOARD_ARTICLE_BY_ADMIN } from '../../../apollo/admin/mutation';
import { BoardArticleCategory, BoardArticleStatus } from '../../../libs/enums/board-article.enum';
import { AllBoardArticlesInquiry } from '../../../libs/types/board-article/board-article.input';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { articleCategoryLabels, imageUrl } from '../../../libs/utils';
import { userVar } from '../../../apollo/store';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

/** community articles: search by title, hide (DELETE) or restore, remove hidden ones for good */
const AdminCommunity: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isSuper = user.memberAdminRole !== 'MODERATOR';
	const [inquiry, setInquiry] = useState<AllBoardArticlesInquiry>({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC' as any,
		search: {},
	});
	const [searchText, setSearchText] = useState<string>('');

	const { data, loading, refetch } = useQuery(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
	});
	const [updateBoardArticleByAdmin] = useMutation(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const [removeBoardArticleByAdmin] = useMutation(REMOVE_BOARD_ARTICLE_BY_ADMIN);
	const list: T[] = data?.getAllBoardArticlesByAdmin?.list ?? [];
	const total: number = data?.getAllBoardArticlesByAdmin?.metaCounter?.[0]?.total ?? 0;

	// search by title after the admin stops typing
	useEffect(() => {
		const timer = setTimeout(() => updateSearch({ text: searchText.trim() || undefined }), 400);
		return () => clearTimeout(timer);
	}, [searchText]);

	const updateSearch = (patch: T) => {
		setInquiry((prev) => {
			const search: T = { ...prev.search, ...patch };
			Object.keys(search).forEach((key) => {
				if (search[key] === undefined) delete search[key];
			});
			return { ...prev, page: 1, search };
		});
	};

	const statusHandler = async (id: string, articleStatus: BoardArticleStatus) => {
		try {
			if (articleStatus === BoardArticleStatus.DELETE && !(await sweetConfirmAlert(t('Hide this article?') as string))) return;
			await updateBoardArticleByAdmin({ variables: { input: { _id: id, articleStatus } } });
			await refetch({ input: inquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const removeHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Remove this article permanently?') as string))) return;
			await removeBoardArticleByAdmin({ variables: { input: id } });
			await refetch({ input: inquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const status = inquiry.search.articleStatus ?? 'ALL';

	return (
		<Box component={'div'} className={'content'}>
			<AdminPageHeader title={t('Articles')} description={t('Articles members wrote in the community. Hide the ones that break the rules.') as string} />
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{(['ALL', BoardArticleStatus.ACTIVE, BoardArticleStatus.DELETE] as const).map((item) => (
						<ListItem
							key={item}
							className={status === item ? 'li on' : 'li'}
							onClick={() => updateSearch({ articleStatus: item === 'ALL' ? undefined : item })}
						>
							{t({ ALL: 'All', ACTIVE: 'Active', DELETE: 'Hidden' }[item])}
						</ListItem>
					))}
				</List>
				<Divider />
				<Stack className={'search-area'} sx={{ m: '24px' }} direction={'row'} gap={2}>
					<OutlinedInput
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						sx={{ flex: 1 }}
						placeholder={t('Search by title') as string}
						endAdornment={
							<InputAdornment position="end">
								<SearchIcon />
							</InputAdornment>
						}
					/>
					<Select
						sx={{ width: '200px' }}
						value={inquiry.search.articleCategory ?? 'ALL'}
						onChange={(e) =>
							updateSearch({ articleCategory: e.target.value === 'ALL' ? undefined : (e.target.value as BoardArticleCategory) })
						}
					>
						<MenuItem value={'ALL'}>{t('All categories')}</MenuItem>
						{Object.values(BoardArticleCategory).map((category) => (
							<MenuItem value={category} key={category}>
								{t(articleCategoryLabels[category] ?? category)}
							</MenuItem>
						))}
					</Select>
				</Stack>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 860 }}>
						<TableHead>
							<TableRow>
								<TableCell>{t('ARTICLE')}</TableCell>
								<TableCell>{t('CATEGORY')}</TableCell>
								<TableCell>{t('AUTHOR')}</TableCell>
								<TableCell align="center">{t('VIEWS')}</TableCell>
								<TableCell align="center">{t('LIKES')}</TableCell>
								<TableCell>{t('DATE')}</TableCell>
								<TableCell align="right">{t('STATUS')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{!list.length && (
								<TableRow>
									<TableCell colSpan={7} align="center">
										{loading ? t('Loading...') : t('No articles found')}
									</TableCell>
								</TableRow>
							)}
							{list.map((article) => {
								const active = article.articleStatus === BoardArticleStatus.ACTIVE;
								const title = (
									<Stack direction={'row'} alignItems={'center'} gap={1.5}>
										{article.articleImage ? (
											<img
												className={'ma-admin-thumb'}
												src={imageUrl(article.articleImage)}
												alt={''}
												onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
											/>
										) : (
											<span className={'ma-admin-thumb'} />
										)}
										<strong>{article.articleTitle}</strong>
									</Stack>
								);
								return (
									<TableRow hover key={article._id}>
										<TableCell>
											{active ? (
												<Link href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`} target={'_blank'}>
													{title}
												</Link>
											) : (
												title
											)}
										</TableCell>
										<TableCell>{t(articleCategoryLabels[article.articleCategory] ?? article.articleCategory)}</TableCell>
										<TableCell>
											<Link href={isSuper ? `/_admin/users/detail?id=${article.memberId}` : `/member?memberId=${article.memberId}`}>
												{article.memberData?.memberNick ?? '—'}
											</Link>
										</TableCell>
										<TableCell align="center">{article.articleViews}</TableCell>
										<TableCell align="center">{article.articleLikes}</TableCell>
										<TableCell>{moment(article.createdAt).format('DD.MM.YYYY')}</TableCell>
										<TableCell align="right">
											<Stack direction={'row'} gap={1} justifyContent={'flex-end'}>
												{active ? (
													<Button size="small" color="error" variant="outlined" onClick={() => statusHandler(article._id, BoardArticleStatus.DELETE)}>
														{t('Hide')}
													</Button>
												) : (
													<>
														<Button size="small" variant="outlined" onClick={() => statusHandler(article._id, BoardArticleStatus.ACTIVE)}>
															{t('Restore')}
														</Button>
														<Button
															size="small"
															color="error"
															variant="outlined"
															title={t('Remove permanently') as string}
															onClick={() => removeHandler(article._id)}
														>
															<DeleteIcon fontSize="small" />
														</Button>
													</>
												)}
											</Stack>
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
					rowsPerPage={inquiry.limit}
					page={total ? inquiry.page - 1 : 0}
					onPageChange={(e: unknown, newPage: number) => setInquiry({ ...inquiry, page: newPage + 1 })}
					onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setInquiry({ ...inquiry, page: 1, limit: parseInt(e.target.value, 10) })
					}
				/>
			</Box>
		</Box>
	);
};

export default withAdminLayout(AdminCommunity);
