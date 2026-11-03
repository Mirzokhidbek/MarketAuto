import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination } from '@mui/material';
import { useTranslation } from 'next-i18next/pages';
import { useRouter } from 'next/router';
import ArticleCard from '../community/ArticleCard';
import { T } from '../../types/common';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticlesInquiry } from '../../types/board-article/board-article.input';
import { GET_BOARD_ARTICLES } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client/react';
import { useLikeArticle } from '../../hooks/useLike';

const MemberArticles: NextPage = ({ initialInput = defaultProps.initialInput, ...props }: any) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [total, setTotal] = useState<number>(0);
	const { memberId } = router.query;
	const [searchFilter, setSearchFilter] = useState<BoardArticlesInquiry>(initialInput);
	const [memberBoArticles, setMemberBoArticles] = useState<BoardArticle[]>([]);

	/** APOLLO REQUESTS **/
	const {
		loading: boardArticlesLoading,
		data: boardArticles,
		error: getBoardArticlesError,
		refetch: boardArticlesRefetch,
	} = useQuery<any>(GET_BOARD_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFilter,
		},
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!boardArticles) return;
		const data: any = boardArticles;
		setMemberBoArticles(data?.getBoardArticles?.list);
		setTotal(data?.getBoardArticles?.metaCounter?.[0]?.total || 0);
	}, [boardArticles]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (memberId) setSearchFilter({ ...initialInput, search: { memberId: memberId } });
	}, [memberId]);

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const likeArticle = useLikeArticle(() => boardArticlesRefetch({ input: searchFilter }));

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Articles')}</h1>
					<p>
						{total || 0} {t('articles')}
					</p>
				</div>
			</div>
			{memberBoArticles?.length ? (
				<div className={'ma-grid ma-grid--3'}>
					{memberBoArticles.map((item: any) => (
						<ArticleCard article={item} key={item._id} onLike={likeArticle} />
					))}
				</div>
			) : (
				<div className={'ma-empty'}>{boardArticlesLoading ? t('Loading...') : t('No articles yet.')}</div>
			)}
			{total > searchFilter.limit && (
				<div className={'ma-pagination'}>
					<Pagination
						count={Math.ceil(total / searchFilter.limit)}
						page={searchFilter.page}
						shape="rounded"
						onChange={paginationHandler}
					/>
				</div>
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

export default MemberArticles;
