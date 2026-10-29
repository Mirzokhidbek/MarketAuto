import React from 'react';
import Link from 'next/link';
import Moment from 'react-moment';
import { useTranslation } from 'next-i18next';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Badge from '../ui/Badge';
import { cx } from '../ui/classNames';
import { articleCategoryLabels, formatEnumLabel, imageUrl } from '../../utils';
import { BoardArticle } from '../../types/board-article/board-article';

interface ArticleCardProps {
	article: BoardArticle;
	/** without it the like counter is read-only */
	onLike?: (id: string) => void;
}

/** article in a list: photo, title, author and date, views and likes */
const ArticleCard = ({ article, onLike }: ArticleCardProps) => {
	const { t } = useTranslation('common');
	const liked = !!article.meLiked?.[0]?.myFavorite;
	const articleHref = {
		pathname: '/community/detail',
		query: { articleCategory: article.articleCategory, id: article._id },
	};
	const categoryLabel = articleCategoryLabels[article.articleCategory] ?? formatEnumLabel(article.articleCategory, t);

	return (
		<article className={'group flex flex-col font-sans'}>
			<Link href={articleHref} className={'relative block aspect-[16/10] overflow-hidden rounded-md bg-surface-alt'}>
				<img
					src={article.articleImage ? imageUrl(article.articleImage) : '/img/community/communityImg.png'}
					alt={article.articleTitle}
					className={'size-full object-cover'}
				/>
				<Badge tone={'light'} className={'absolute bottom-2.5 left-2.5'}>
					{t(categoryLabel)}
				</Badge>
			</Link>

			<div className={'flex flex-1 flex-col px-0.5 pt-3'}>
				<Link href={articleHref} className={'mb-1.5 block whitespace-normal'}>
					<h3 className={'text-[15.5px] leading-snug font-semibold text-ink group-hover:text-primary'}>
						{article.articleTitle}
					</h3>
				</Link>

				<div className={'flex justify-between gap-3 text-[13px] text-muted'}>
					<Link
						href={{ pathname: '/member', query: { memberId: article.memberData?._id } }}
						className={'truncate text-muted hover:text-primary'}
					>
						{article.memberData?.memberNick}
					</Link>
					<Moment format={'DD MMM YYYY'} className={'shrink-0'}>
						{article.createdAt}
					</Moment>
				</div>

				<div
					className={
						'mt-2.5 flex items-center justify-between border-t border-line pt-2.5 text-[13px] text-muted tabular-nums [&_svg]:text-[17px]!'
					}
				>
					<span className={'inline-flex items-center gap-1'} title={t('views') as string}>
						<RemoveRedEyeIcon /> {article.articleViews}
					</span>
					<button
						type={'button'}
						disabled={!onLike}
						onClick={() => onLike?.(article._id)}
						aria-label={`${t('Like')}: ${article.articleLikes ?? 0}`}
						aria-pressed={liked}
						className={cx(
							'inline-flex items-center gap-1 text-[13px] text-muted enabled:cursor-pointer',
							liked && '[&_svg]:text-danger',
						)}
					>
						{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {article.articleLikes}
					</button>
				</div>
			</div>
		</article>
	);
};

export default ArticleCard;
