import EmptyState from '../ui/EmptyState';
import React, { useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Pagination, Stack, Typography } from '@mui/material';
import ArticleCard from '../community/ArticleCard';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { useLikeArticle } from '../../hooks/useLike';

const MyArticles: NextPage = ({ initialInput, ...props }: T) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [searchCommunity, setSearchCommunity] = useState({
		...initialInput,
		search: { memberId: user._id },
	});
	const [boardArticles, setBoardArticles] = useState<BoardArticle[]>([]);
	const [totalCount, setTotalCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
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

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticle = useLikeArticle(() => boardArticlesRefetch({ input: searchCommunity }));

	return (
		<div id="my-articles-page" className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('My Articles')}</h1>
					<p>{t('Articles you shared with the CarPort community.')}</p>
				</div>
				<button className={'ma-btn ma-btn--primary'} onClick={() => router.push('/mypage?category=writeArticle')}>
					+ {t('Write Article')}
				</button>
			</div>
			{boardArticles?.length > 0 ? (
				<div className={'ma-grid ma-grid--3'}>
					{boardArticles.map((boardArticle: BoardArticle) => (
						<ArticleCard article={boardArticle} key={boardArticle._id} onLike={likeArticle} />
					))}
				</div>
			) : (
				<EmptyState
					text={t('You have not written any articles yet.')}
					actionLabel={t('Write Article')}
					actionHref={'/mypage?category=writeArticle'}
				/>
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
	);
};

MyArticles.defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default MyArticles;
