import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Pagination } from '@mui/material';
import CommunityCard from '../../libs/components/common/CommunityCard';
import { useTranslation } from 'next-i18next';
import { articleCategoryLabels } from '../../libs/utils';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { LIKE_TARGET_BOARD_ARTICLE } from '../../apollo/user/mutation';
import { useMutation, useQuery } from '@apollo/client';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Community: NextPage = ({ initialInput, ...props }: T) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { query } = router;
	const articleCategory = query?.articleCategory as string;
	const [searchCommunity, setSearchCommunity] = useState<BoardArticlesInquiry>({
		...initialInput,
		search: { ...initialInput.search },
	});
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);

	const {
		loading: boardArticlesLoading,
		data: boardArticlesData,
		error: getBoardArticlesError,
		refetch: boardArticlesRefetch,
	} = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchCommunity,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setBoardArticles(data?.getBoardArticles?.list);
			setTotalCount(data?.getBoardArticles?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		if (!query?.articleCategory)
			router.push(
				{
					pathname: router.pathname,
					query: { articleCategory: 'FREE' },
				},
				router.pathname,
				{ shallow: true },
			);
	}, [router.isReady]);

	// the category arrives in router.query after the first render of this static page
	useEffect(() => {
		const category = query?.articleCategory as BoardArticleCategory | undefined;
		if (category && category !== searchCommunity.search.articleCategory) {
			setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: category } });
		}
	}, [query?.articleCategory]);

	/** HANDLERS **/
	const tabChangeHandler = async (e: T, value: string) => {

		setSearchCommunity({ ...searchCommunity, page: 1, search: { articleCategory: value as BoardArticleCategory } });
		await router.push(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			router.pathname,
			{ shallow: true },
		);
	};

	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticleHandler = async (e: any, user: any, id: string) => {
		try {
			e.stopPropagation();
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetBoardArticle({
				variables: {
					input: id,
				},
			});
			await boardArticlesRefetch({ input: searchCommunity });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const categories = [
		BoardArticleCategory.NEWS,
		BoardArticleCategory.RECOMMEND,
		BoardArticleCategory.FREE,
		BoardArticleCategory.SERVICE,
	];

	return (
		<div id="community-list-page" className={'ma-page ma-list-page'}>
			<div className={'ma-container'}>
				<div className={'ma-results__bar'}>
					<div>
						<h2>{t('Community')}</h2>
						<span>{t('News, reviews and stories from car owners')}</span>
					</div>
					<button
						className={'ma-btn ma-btn--primary'}
						onClick={() =>
							router.push(
								{ pathname: '/mypage', query: { category: 'writeArticle' } },
								'/mypage?category=writeArticle',
								{
									scroll: false,
								},
							)
						}
					>
						+ {t('Write Article')}
					</button>
				</div>

				<div className={'ma-tabs ma-tabs--underline'}>
					{categories.map((category) => (
						<button
							key={category}
							className={`ma-tab ${searchCommunity.search.articleCategory === category ? 'is-active' : ''}`}
							onClick={(e) => tabChangeHandler(e, category)}
						>
							{t(articleCategoryLabels[category])}
						</button>
					))}
				</div>

				{boardArticles?.length ? (
					<div className={'ma-grid ma-grid--3'}>
						{boardArticles.map((boardArticle: BoardArticle) => (
							<CommunityCard
								boardArticle={boardArticle}
								key={boardArticle?._id}
								likeArticleHandler={likeArticleHandler}
							/>
						))}
					</div>
				) : (
					<div className={'ma-empty'}>{t('No articles in this category yet.')}</div>
				)}

				{totalCount > searchCommunity.limit && (
					<div className={'ma-pagination'}>
						<Pagination
							count={Math.ceil(totalCount / searchCommunity.limit)}
							page={searchCommunity.page}
							shape="rounded"
							onChange={paginationHandler}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

Community.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'ASC',
		search: {
			articleCategory: 'FREE',
		},
	},
};

export default withLayoutBasic(Community);
