import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { articleCategoryLabels, formatEnumLabel } from '../../utils';
import { BoardArticle } from '../../types/board-article/board-article';
import Moment from 'react-moment';
import { REACT_APP_API_URL } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface CommunityCardProps {
	boardArticle: BoardArticle;
	size?: string;
	likeArticleHandler?: any;
}

const CommunityCard = (props: CommunityCardProps) => {
	const { boardArticle, size = 'normal', likeArticleHandler } = props;
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const imagePath: string = boardArticle?.articleImage
		? `${REACT_APP_API_URL}/${boardArticle?.articleImage}`
		: '/img/community/communityImg.png';

	/** HANDLERS **/
	const chooseArticleHandler = (e: React.SyntheticEvent, boardArticle: BoardArticle) => {
		router.push(
			{
				pathname: '/community/detail',
				query: { articleCategory: boardArticle?.articleCategory, id: boardArticle?._id },
			},
			undefined,
			{ shallow: true },
		);
	};

	const goMemberPage = (id: string) => {
		if (id === user?._id) router.push('/mypage');
		else router.push(`/member?memberId=${id}`);
	};

	const liked = !!(boardArticle?.meLiked && boardArticle?.meLiked[0]?.myFavorite);

	return (
		<article
			className={`ma-article-card ${size === 'small' ? 'is-small' : ''}`}
			onClick={(e: any) => chooseArticleHandler(e, boardArticle)}
		>
			<div className={'ma-article-card__media'}>
				<img src={imagePath} alt={boardArticle?.articleTitle} />
				<span className={'ma-badge ma-badge--light'}>
					{t(articleCategoryLabels[boardArticle?.articleCategory] ?? formatEnumLabel(boardArticle?.articleCategory))}
				</span>
			</div>
			<div className={'ma-article-card__body'}>
				<h3>{boardArticle?.articleTitle}</h3>
				<div className={'ma-article-card__meta'}>
					<span
						className={'ma-article-card__author'}
						onClick={(e: any) => {
							e.stopPropagation();
							goMemberPage(boardArticle?.memberData?._id as string);
						}}
					>
						{boardArticle?.memberData?.memberNick}
					</span>
					<span>
						<Moment format={'DD MMM YYYY'}>{boardArticle?.createdAt}</Moment>
					</span>
				</div>
				<div className={'ma-article-card__stats'}>
					<span>
						<RemoveRedEyeIcon /> {boardArticle?.articleViews}
					</span>
					<button
						className={liked ? 'is-liked' : ''}
						onClick={(e: any) => {
							e.stopPropagation();
							likeArticleHandler?.(e, user, boardArticle?._id as string);
						}}
					>
						{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {boardArticle?.articleLikes}
					</button>
				</div>
			</div>
		</article>
	);
};

export default CommunityCard;
