import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import Link from 'next/link';
import { articleCategoryLabels, fetchWithTimeout, imageUrl } from '../../libs/utils';
import { print } from 'graphql';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import Seo from '../../libs/components/common/Seo';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import Moment from 'react-moment';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import dynamic from 'next/dynamic';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import AdminRemoveComment from '../../libs/components/admin/AdminRemoveComment';
import {
	sweetConfirmAlert,
	sweetMixinErrorAlert,
	sweetMixinSuccessAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
import { EyeIcon as RemoveRedEyeIcon, DeleteIcon as DeleteForeverIcon, ThumbUpIcon as ThumbUpOffAltIcon, ThumbUpFilledIcon as ThumbUpAltIcon, EyeIcon as VisibilityIcon, ChatIcon, ChatIcon as ChatBubbleOutlineRoundedIcon, EditIcon } from '../../libs/components/ui/icons';
import { iconButton, inputClass, linkButton, linkButtonDanger } from '../../libs/components/ui/styles';
import { buttonClasses } from '../../libs/components/ui/Button';
import Pagination from '../../libs/components/ui/Pagination';
import PageContainer from '../../libs/components/ui/PageContainer';
import Badge from '../../libs/components/ui/Badge';

const panelBox = 'rounded-[10px] border border-line bg-white p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6';
const commentForm = 'mb-5 flex flex-col items-end gap-2.5';
const commentFoot = 'flex w-full items-center justify-between [&>span]:text-xs [&>span]:text-muted';
const ArticleViewer = dynamic(() => import('../../libs/components/community/ArticleViewer'), { ssr: false });

/** the article is fetched on the server too, so search engines and link previews see its title and text */
const fetchArticle = async (id?: string) => {
	// API_INTERNAL_GRAPHQL_URL: server-only address (e.g. http://api:3007/graphql inside docker)
	const url = process.env.API_INTERNAL_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL;
	if (!id || !url) return null;
	try {
		const response = await fetchWithTimeout(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ query: print(GET_BOARD_ARTICLE), variables: { input: id } }),
		});
		const { data } = await response.json();
		const article = data?.getBoardArticle ?? null;
		if (article?.memberData) article.memberData = { ...article.memberData, memberPhone: null };
		return article;
	} catch (err) {
		return null;
	}
};

/** plain text of the article HTML for the meta description */
const articleSummary = (html?: string) =>
	(html ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 160);

export const getServerSideProps = async ({ locale, query }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
		initialArticle: await fetchArticle(query?.id),
	},
});

const CommunityDetail: NextPage = ({ initialInput = defaultProps.initialInput, initialArticle, ...props }: T) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { query } = router;

	const articleId = query?.id as string;
	const articleCategory = query?.articleCategory as string;

	const [comment, setComment] = useState<string>('');
	const [wordsCnt, setWordsCnt] = useState<number>(0);
	const [updatedCommentWordsCnt, setUpdatedCommentWordsCnt] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFilter, setSearchFilter] = useState<CommentsInquiry>({
		...initialInput,
	});
	const [memberImage, setMemberImage] = useState<string>(
		initialArticle?.memberData?.memberImage
			? imageUrl(initialArticle.memberData.memberImage)
			: '/img/community/articleImg.png',
	);
	const [anchorEl, setAnchorEl] = useState<any | null>(null);
	const open = Boolean(anchorEl);
	const id = open ? 'simple-popover' : undefined;
	const [openBackdrop, setOpenBackdrop] = useState<boolean>(false);
	const [updatedComment, setUpdatedComment] = useState<string>('');
	const [updatedCommentId, setUpdatedCommentId] = useState<string>('');
	const [likeLoading, setLikeLoading] = useState<boolean>(false);
	const [boardArticle, setBoardArticle] = useState<BoardArticle | undefined>(initialArticle ?? undefined);

	/** APOLLO REQUESTS **/
	const [likeTargetBoardArticle] = useMutation<any>(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation<any>(CREATE_COMMENT);
	const [updateComment] = useMutation<any>(UPDATE_COMMENT);

	const {
		loading: boardArticleLoading,
		data: boardArticleData,
		error: getBoardArticleError,
		refetch: boardArticleRefetch,
	} = useQuery<any>(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: {
			input: articleId,
		},
		skip: !articleId, // router query is empty on the first render
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!boardArticleData) return;
		const data: any = boardArticleData;
		setBoardArticle(data?.getBoardArticle);
		if (data?.getBoardArticle?.memberData?.memberImage) {
			setMemberImage(imageUrl(data?.getBoardArticle?.memberData?.memberImage));
		}
	}, [boardArticleData]);

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery<any>(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFilter,
		},
		skip: !searchFilter?.search?.commentRefId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getCommentsData) return;
		const data: any = getCommentsData;
		setComments(data.getComments.list);
		setTotal(data.getComments?.metaCounter?.[0]?.total || 0);
	}, [getCommentsData]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (articleId) setSearchFilter({ ...searchFilter, search: { commentRefId: articleId } });
	}, [articleId]);

	/** HANDLERS **/
	const tabChangeHandler = (event: React.SyntheticEvent, value: string) => {
		router.replace(
			{
				pathname: '/community',
				query: { articleCategory: value },
			},
			'/community',
			{ shallow: true },
		);
	};

	const likeBoArticleHandler = async (user: any, id: any) => {
		try {
			if (likeLoading) return;
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			setLikeLoading(true);

			await likeTargetBoardArticle({
				variables: {
					input: id,
				},
			});
			await boardArticleRefetch({ input: articleId });
			await sweetTopSmallSuccessAlert('Success!', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		} finally {
			setLikeLoading(false);
		}
	};

	const creteCommentHandler = async () => {
		if (!comment) return;
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const commentInput: CommentInput = {
				commentGroup: CommentGroup.ARTICLE,
				commentRefId: articleId,
				commentContent: comment,
			};
			await createComment({
				variables: {
					input: commentInput,
				},
			});
			await getCommentsRefetch({ input: searchFilter });
			await boardArticleRefetch({ input: articleId });
			setComment('');
			await sweetMixinSuccessAlert('Successfully commented!');
		} catch (error: any) {
			await sweetMixinErrorAlert(error.message);
		}
	};

	const updateButtonHandler = async (commentId: string, commentStatus?: CommentStatus.DELETE) => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!commentId) throw new Error('Select a comment to update!');
			if (updatedComment === comments?.find((comment) => comment?._id === commentId)?.commentContent) return;

			const updateData: CommentUpdate = {
				_id: commentId,
				...(commentStatus && { commentStatus: commentStatus }),
				...(updatedComment && { commentContent: updatedComment }),
			};

			if (!updateData?.commentContent && !updateData?.commentStatus)
				throw new Error('Provide data to update your comment!');

			if (commentStatus) {
				if (await sweetConfirmAlert('Do you want to delete the comment?')) {
					await updateComment({
						variables: {
							input: updateData,
						},
					});
					await sweetMixinSuccessAlert('Successfully deleted!');
				} else return;
			} else {
				await updateComment({
					variables: {
						input: updateData,
					},
				});
				await sweetMixinSuccessAlert('Successfully updated!');
			}
			await getCommentsRefetch({ input: searchFilter });
		} catch (error: any) {
			await sweetMixinErrorAlert(error.message);
		} finally {
			setOpenBackdrop(false);
			setUpdatedComment('');
			setUpdatedCommentWordsCnt(0);
			setUpdatedCommentId('');
		}
	};

	const getCommentMemberImage = (image: string | undefined) => {
		if (image) return imageUrl(image);
		else return '/img/community/articleImg.png';
	};

	const goMemberPage = (id: any) => {
		router.push(`/member?memberId=${id}`);
	};

	const cancelButtonHandler = () => {
		setOpenBackdrop(false);
		setUpdatedComment('');
		setUpdatedCommentWordsCnt(0);
	};

	const updateCommentInputHandler = (value: string) => {
		if (value.length > 100) return;
		setUpdatedCommentWordsCnt(value.length);
		setUpdatedComment(value);
	};

	const paginationHandler = (value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const liked = !!(boardArticle?.meLiked && boardArticle?.meLiked[0]?.myFavorite);

	return (
		<div id="community-detail-page" className="pt-[72px] pb-20 font-sans md:pt-[92px]">
			{boardArticle?.articleTitle && (
				<Seo
					title={boardArticle.articleTitle}
					description={articleSummary(boardArticle.articleContent) || undefined}
					image={boardArticle.articleImage ? imageUrl(boardArticle.articleImage) : undefined}
				/>
			)}
			<PageContainer className="w-[860px]!">
				<nav className="mb-[18px] flex items-center gap-2 text-[13px] text-muted max-sm:hidden">
					<Link href={'/'} className="text-muted hover:text-primary">{t('Home')}</Link>
					<span>/</span>
					<Link href={`/community?articleCategory=${articleCategory ?? 'FREE'}`} className="text-muted hover:text-primary">{t('Community')}</Link>
					<span>/</span>
					<em className="overflow-hidden text-ellipsis whitespace-nowrap text-text not-italic">{boardArticle?.articleTitle}</em>
				</nav>

				<article className={`${panelBox} mb-6`}>
					<Badge>
						{t(articleCategoryLabels[boardArticle?.articleCategory as string] ?? '')}
					</Badge>
					<h1 className="m-0 mt-3.5 mb-[18px] text-2xl leading-[1.25] font-bold tracking-[-0.02em] text-ink sm:text-[32px]">{boardArticle?.articleTitle}</h1>
					<div className="flex items-center gap-3 border-b border-line pb-5 max-sm:flex-wrap">
						<img src={memberImage} alt={''} className="size-11 cursor-pointer rounded-full object-cover" onClick={() => goMemberPage(boardArticle?.memberData?._id)} />
						<div>
							<strong className="block cursor-pointer text-[15px] text-ink" onClick={() => goMemberPage(boardArticle?.memberData?._id)}>
								{boardArticle?.memberData?.memberNick}
							</strong>
							<span className="text-[13px] text-muted">
								{boardArticle?.createdAt && <Moment format={'DD MMM YYYY, HH:mm'}>{boardArticle.createdAt}</Moment>}
							</span>
						</div>
						<div className="flex items-center gap-4 text-muted max-sm:w-full sm:ml-auto [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1 [&_svg]:text-lg">
							<span>
								<RemoveRedEyeIcon /> {boardArticle?.articleViews}
							</span>
							<span>
								<ChatBubbleOutlineRoundedIcon /> {boardArticle?.articleComments}
							</span>
							<button
								className={`${iconButton} ${liked ? '[&_svg]:text-primary' : ''}`}
								disabled={likeLoading}
								onClick={() => likeBoArticleHandler(user, boardArticle?._id)}
							>
								{liked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />} {boardArticle?.articleLikes}
							</button>
						</div>
					</div>
					<div className="pt-[22px] text-base leading-[1.75] text-text [&_img]:max-w-full [&_img]:rounded-xl">
						<ArticleViewer markdown={boardArticle?.articleContent} className={'ytb_play'} />
					</div>
				</article>

				<section className={`${panelBox} mb-8`}>
					<h2 className="m-0 mb-4 text-[19px] font-bold text-ink">
						{t('Comments')} <small className="text-[15px] font-medium text-muted">({total})</small>
					</h2>
					<div className={commentForm}>
						<textarea
							className={`${inputClass} h-auto! min-h-24 w-full resize-y py-3`}
							placeholder={t('Write a comment...') as string}
							value={comment}
							maxLength={100}
							onChange={(e) => {
								setWordsCnt(e.target.value.length);
								setComment(e.target.value);
							}}
						></textarea>
						<div className={commentFoot}>
							<span>{wordsCnt}/100</span>
							<button
								className={buttonClasses()}
								disabled={!comment || !user?._id}
								onClick={creteCommentHandler}
							>
								{user?._id ? t('Post comment') : t('Login to comment')}
							</button>
						</div>
					</div>

					{comments?.map((commentData) => {
						const isMine = commentData?.memberId === user?._id;
						const editing = updatedCommentId === commentData?._id && openBackdrop;
						return (
							<div className="flex gap-3.5 border-t border-line py-4" key={commentData?._id}>
								<img
									className="size-10 shrink-0 cursor-pointer rounded-full object-cover"
									src={getCommentMemberImage(commentData?.memberData?.memberImage)}
									alt={''}
									onClick={() => goMemberPage(commentData?.memberData?._id as string)}
								/>
								<div className="min-w-0 flex-1">
									<div className="mb-1 flex items-center gap-2.5">
										<strong className="cursor-pointer text-sm text-ink" onClick={() => goMemberPage(commentData?.memberData?._id as string)}>
											{commentData?.memberData?.memberNick}
										</strong>
										<span className="text-xs text-muted">
											<Moment format={'DD MMM YYYY, HH:mm'}>{commentData?.createdAt}</Moment>
										</span>
										{isMine && !editing && (
											<span className="ml-auto inline-flex gap-2.5">
												<button
													className={linkButton}
													onClick={() => {
														setUpdatedComment(commentData?.commentContent);
														setUpdatedCommentWordsCnt(commentData?.commentContent?.length);
														setUpdatedCommentId(commentData?._id);
														setOpenBackdrop(true);
													}}
												>
													{t('Edit')}
												</button>
												<button
													className={linkButtonDanger}
													onClick={() => updateButtonHandler(commentData?._id, CommentStatus.DELETE)}
												>
													{t('Delete')}
												</button>
											</span>
										)}
										{!isMine && (
											<span className="ml-auto inline-flex gap-2.5">
												<AdminRemoveComment
													commentId={commentData?._id}
													onRemoved={() => getCommentsRefetch({ input: searchFilter })}
												/>
											</span>
										)}
									</div>
									{editing ? (
										<div className={commentForm}>
											<textarea
												className={`${inputClass} h-auto! min-h-24 w-full resize-y py-3`}
												value={updatedComment}
												onChange={(e) => updateCommentInputHandler(e.target.value)}
											></textarea>
											<div className={commentFoot}>
												<span>{updatedCommentWordsCnt}/100</span>
												<div>
													<button className={buttonClasses({ variant: 'outline' })} onClick={cancelButtonHandler}>
														{t('Cancel')}
													</button>{' '}
													<button
														className={buttonClasses()}
														onClick={() => updateButtonHandler(updatedCommentId, undefined)}
													>
														{t('Save')}
													</button>
												</div>
											</div>
										</div>
									) : (
										<p className="m-0 text-sm leading-[1.6] text-text">{commentData?.commentContent}</p>
									)}
								</div>
							</div>
						);
					})}

					{total > searchFilter.limit && (
						<Pagination page={searchFilter.page} total={total} pageSize={searchFilter.limit} onChange={paginationHandler} />
					)}
				</section>
			</PageContainer>
		</div>
	);
};

// React 19 has no defaultProps on function components: used as the default value below
const defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutFull(CommunityDetail);
