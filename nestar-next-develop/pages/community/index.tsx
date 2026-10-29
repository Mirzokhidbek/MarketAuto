import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ArticleCard from '../../libs/components/community/ArticleCard';
import PageContainer from '../../libs/components/ui/PageContainer';
import ListHeader from '../../libs/components/ui/ListHeader';
import UnderlineTabs from '../../libs/components/ui/UnderlineTabs';
import EmptyState from '../../libs/components/ui/EmptyState';
import Pagination from '../../libs/components/ui/Pagination';
import { ButtonLink } from '../../libs/components/ui/Button';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { useLikeArticle } from '../../libs/hooks/useLike';
import { articleCategoryLabels } from '../../libs/utils';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticlesInquiry } from '../../libs/types/board-article/board-article.input';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Direction } from '../../libs/enums/common.enum';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 6;

const CATEGORIES = [
	BoardArticleCategory.NEWS,
	BoardArticleCategory.RECOMMEND,
	BoardArticleCategory.FREE,
	BoardArticleCategory.SERVICE,
];

const isCategory = (value: unknown): value is BoardArticleCategory =>
	CATEGORIES.includes(value as BoardArticleCategory);

/** /community?articleCategory=NEWS&page=2 — articles by category, newest first */
const Community: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const category = isCategory(router.query.articleCategory) ? router.query.articleCategory : BoardArticleCategory.FREE;
	const page = Math.max(1, Number(router.query.page) || 1);

	const input: BoardArticlesInquiry = {
		page,
		limit: PAGE_SIZE,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { articleCategory: category },
	};

	const { data, previousData, loading, refetch } = useQuery(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input },
		skip: !router.isReady,
		notifyOnNetworkStatusChange: true,
	});
	const result = (data ?? previousData)?.getBoardArticles;
	const articles: BoardArticle[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;

	const likeArticle = useLikeArticle(() => refetch());

	/** HANDLERS **/
	const openPage = (nextCategory: BoardArticleCategory, nextPage: number, scrollToTop = false) =>
		router.push({ pathname: '/community', query: { articleCategory: nextCategory, page: nextPage } }, undefined, {
			shallow: true,
			scroll: scrollToTop,
		});

	return (
		<div className={'bg-white pt-8 pb-20 font-sans text-text'}>
			<PageContainer>
				<ListHeader
					summary={t('News, reviews and stories from car owners')}
					actions={
						<ButtonLink href={{ pathname: '/mypage', query: { category: 'writeArticle' } }}>
							+ {t('Write Article')}
						</ButtonLink>
					}
				/>

				<UnderlineTabs
					items={CATEGORIES.map((item) => ({ value: item, label: t(articleCategoryLabels[item]) }))}
					value={category}
					onChange={(nextCategory) => openPage(nextCategory, 1)}
				/>

				{articles.length === 0 ? (
					<EmptyState loading={loading || !result} text={t('No articles in this category yet.')} />
				) : (
					<div className={'grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3'}>
						{articles.map((article) => (
							<ArticleCard article={article} key={article._id} onLike={likeArticle} />
						))}
					</div>
				)}

				<Pagination
					page={page}
					total={total}
					pageSize={PAGE_SIZE}
					onChange={(nextPage) => openPage(category, nextPage, true)}
				/>
			</PageContainer>
		</div>
	);
};

export default withLayoutBasic(Community);
