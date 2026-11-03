import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
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
import { DeleteIcon } from '../../../libs/components/ui/icons';
import { cx } from '../../../libs/components/ui/classNames';
import { adminButton, AdminPager, AdminSearch, AdminSelect, AdminTabs, adminTable, NoRows, searchArea, TableScroll, tableWrap, td, tdActions, tdTitle, th, thumb, tr } from '../../../libs/components/admin/ui';
import { formatDate } from '../../../libs/date';

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

	const { data, loading, refetch } = useQuery<any>(GET_ALL_BOARD_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
	});
	const [updateBoardArticleByAdmin] = useMutation<any>(UPDATE_BOARD_ARTICLE_BY_ADMIN);
	const [removeBoardArticleByAdmin] = useMutation<any>(REMOVE_BOARD_ARTICLE_BY_ADMIN);
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
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader title={t('Articles')} description={t('Articles members wrote in the community. Hide the ones that break the rules.') as string} />
			<div className={tableWrap}>
				<AdminTabs
					value={status as string}
					onChange={(item) => updateSearch({ articleStatus: item === 'ALL' ? undefined : item })}
					items={(['ALL', BoardArticleStatus.ACTIVE, BoardArticleStatus.DELETE] as const).map((item) => ({
						value: item as string,
						label: t({ ALL: 'All', ACTIVE: 'Active', DELETE: 'Hidden' }[item]),
					}))}
				/>
				<div className={searchArea}>
					<AdminSearch value={searchText} onChange={setSearchText} placeholder={t('Search by title') as string} />
					<AdminSelect
						className="md:w-[200px]"
						value={inquiry.search.articleCategory ?? 'ALL'}
						onChange={(category) => updateSearch({ articleCategory: category === 'ALL' ? undefined : (category as BoardArticleCategory) })}
						options={[
							{ value: 'ALL', label: t('All categories') },
							...Object.values(BoardArticleCategory).map((category) => ({
								value: category,
								label: t(articleCategoryLabels[category] ?? category),
							})),
						]}
					/>
				</div>
				<TableScroll>
					<table className={cx(adminTable, 'md:min-w-[860px]')}>
						<thead>
							<tr>
								<th className={th}>{t('ARTICLE')}</th>
								<th className={th}>{t('CATEGORY')}</th>
								<th className={th}>{t('AUTHOR')}</th>
								<th className={cx(th, 'text-center')}>{t('VIEWS')}</th>
								<th className={cx(th, 'text-center')}>{t('LIKES')}</th>
								<th className={th}>{t('DATE')}</th>
								{/* the tabs above filter by status; this column holds what can be done with the article */}
								<th className={cx(th, 'text-right')}>{t('ACTIONS')}</th>
							</tr>
						</thead>
						<tbody>
							{!list.length && <NoRows colSpan={7}>{loading ? t('Loading...') : t('No articles found')}</NoRows>}
							{list.map((article) => {
								const active = article.articleStatus === BoardArticleStatus.ACTIVE;
								const title = (
									<span className="flex items-center gap-3">
										{article.articleImage ? (
											<img
												className={thumb}
												src={imageUrl(article.articleImage)}
												alt={''}
												onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
											/>
										) : (
											<span className={thumb} />
										)}
										<strong className="text-[#0f172a]">{article.articleTitle}</strong>
									</span>
								);
								return (
									<tr key={article._id} className={tr}>
										<td className={cx(td, tdTitle)}>
											{active ? (
												<Link href={`/community/detail?articleCategory=${article.articleCategory}&id=${article._id}`} target={'_blank'}>
													{title}
												</Link>
											) : (
												title
											)}
										</td>
										<td className={td} data-label={t('CATEGORY')}>
											{t(articleCategoryLabels[article.articleCategory] ?? article.articleCategory)}
										</td>
										<td className={td} data-label={t('AUTHOR')}>
											<Link
												className="text-[#1d4ed8]"
												href={isSuper ? `/_admin/users/detail?id=${article.memberId}` : `/member?memberId=${article.memberId}`}
											>
												{article.memberData?.memberNick ?? '—'}
											</Link>
										</td>
										<td className={cx(td, 'text-center')} data-label={t('VIEWS')}>
											{article.articleViews}
										</td>
										<td className={cx(td, 'text-center')} data-label={t('LIKES')}>
											{article.articleLikes}
										</td>
										<td className={cx(td, 'whitespace-nowrap')} data-label={t('DATE')}>
											{formatDate(article.createdAt, 'DD.MM.YYYY')}
										</td>
										<td className={cx(td, tdActions, 'text-right')}>
											<span className="flex justify-end gap-2">
												{active ? (
													<button
														className={adminButton({ size: 'sm', variant: 'outlined', color: 'error' })}
														onClick={() => statusHandler(article._id, BoardArticleStatus.DELETE)}
													>
														{t('Hide')}
													</button>
												) : (
													<>
														<button
															className={adminButton({ size: 'sm', variant: 'outlined', color: 'primary' })}
															onClick={() => statusHandler(article._id, BoardArticleStatus.ACTIVE)}
														>
															{t('Restore')}
														</button>
														<button
															className={adminButton({ size: 'sm', variant: 'outlined', color: 'error', className: 'w-8 px-0' })}
															title={t('Remove permanently') as string}
															aria-label={t('Remove permanently') as string}
															onClick={() => removeHandler(article._id)}
														>
															<DeleteIcon fontSize="small" />
														</button>
													</>
												)}
											</span>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</TableScroll>
				<AdminPager
					total={total}
					page={inquiry.page}
					limit={inquiry.limit}
					options={[10, 20, 40]}
					onPage={(page) => setInquiry({ ...inquiry, page })}
					onLimit={(limit) => setInquiry({ ...inquiry, page: 1, limit })}
				/>
			</div>
		</div>
	);
};

export default withAdminLayout(AdminCommunity);
