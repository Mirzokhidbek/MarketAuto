import EmptyState from '../ui/EmptyState';
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import { useRouter } from 'next/router';
import ArticleCard from '../community/ArticleCard';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { useLikeArticle } from '../../hooks/useLike';
import { accountPanel, accountPanelHead } from '../ui/styles';
import { buttonClasses } from '../ui/Button';
import Pagination from '../ui/Pagination';

const MyArticles: NextPage = ({ initialInput = defaultProps.initialInput, ...props }: T) => {
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
	} = useQuery<any>(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchCommunity,
		},
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!boardArticlesData) return;
		const data: any = boardArticlesData;
		setBoardArticles(data?.getBoardArticles?.list);
		setTotalCount(data?.getBoardArticles?.metaCounter[0]?.total);
	}, [boardArticlesData]);

	/** HANDLERS **/
	const paginationHandler = (value: number) => {
		setSearchCommunity({ ...searchCommunity, page: value });
	};

	const likeArticle = useLikeArticle(() => boardArticlesRefetch({ input: searchCommunity }));

	return (
		<div id="my-articles-page" className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('My Articles')}</h1>
					<p>{t('Articles you shared with the CarPort community.')}</p>
				</div>
				<button className={buttonClasses()} onClick={() => router.push('/mypage?category=writeArticle')}>
					+ {t('Write Article')}
				</button>
			</div>
			{boardArticles?.length > 0 ? (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
				<Pagination page={searchCommunity.page} total={totalCount} pageSize={searchCommunity.limit} onChange={paginationHandler} />
			)}
		</div>
	);
};

// React 19 has no defaultProps on function components: used as the default value below
const defaultProps = {
	initialInput: {
		page: 1,
		limit: 6,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default MyArticles;
