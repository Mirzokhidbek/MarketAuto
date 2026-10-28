import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { articleCategoryLabels, fetchWithTimeout, imageUrl } from '../../libs/utils';
import { print } from 'graphql';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import Seo from '../../libs/components/common/Seo';
import { Pagination } from '@mui/material';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import Moment from 'react-moment';
import { userVar } from '../../apollo/store';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatIcon from '@mui/icons-material/Chat';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import dynamic from 'next/dynamic';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import EditIcon from '@mui/icons-material/Edit';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { CREATE_COMMENT, LIKE_TARGET_BOARD_ARTICLE, UPDATE_COMMENT } from '../../apollo/user/mutation';
import { GET_BOARD_ARTICLE, GET_COMMENTS } from '../../apollo/user/query';
import {
	sweetConfirmAlert,
	sweetMixinErrorAlert,
	sweetMixinSuccessAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';
import { CommentUpdate } from '../../libs/types/comment/comment.update';
const ToastViewerComponent = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

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

const CommunityDetail: NextPage = ({ initialInput, initialArticle, ...props }: T) => {
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
		initialArticle?.memberData?.memberImage ? imageUrl(initialArticle.memberData.memberImage) : '/img/community/articleImg.png',
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
	const [likeTargetBoardArticle] = useMutation(LIKE_TARGET_BOARD_ARTICLE);
	const [createComment] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);

	const {
		loading: boardArticleLoading,
		data: boardArticleData,
		error: getBoardArticleError,
		refetch: boardArticleRefetch,
	} = useQuery(GET_BOARD_ARTICLE, {
		fetchPolicy: 'network-only',
		variables: {
			input: articleId,
		},
		skip: !articleId, // router query is empty on the first render
		notifyOnNetworkStatusChange: true,
		onCompleted(data: any) {
			setBoardArticle(data?.getBoardArticle);
			if (data?.getBoardArticle?.memberData?.memberImage) {
				setMemberImage(imageUrl(data?.getBoardArticle?.memberData?.memberImage));
			}
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFilter,
		},
		skip: !searchFilter?.search?.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted(data: any) {
			setComments(data.getComments.list);
			setTotal(data.getComments?.metaCounter?.[0]?.total || 0);
		},
	});

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

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const liked = !!(boardArticle?.meLiked && boardArticle?.meLiked[0]?.myFavorite);

	return (
		<div id="community-detail-page" className={'ma-page ma-detail'}>
			{boardArticle?.articleTitle && (
				<Seo
					title={boardArticle.articleTitle}
					description={articleSummary(boardArticle.articleContent) || undefined}
					image={boardArticle.articleImage ? imageUrl(boardArticle.articleImage) : undefined}
				/>
			)}
			<div className={'ma-container ma-container--narrow'}>
				<nav className={'ma-breadcrumb'}>
					<Link href={'/'}>{t('Home')}</Link>
					<span>/</span>
					<Link href={`/community?articleCategory=${articleCategory ?? 'FREE'}`}>{t('Community')}</Link>
					<span>/</span>
					<em>{boardArticle?.articleTitle}</em>
				</nav>

				<article className={'ma-panel ma-article'}>
					<span className={'ma-badge ma-badge--primary'}>
						{t(articleCategoryLabels[boardArticle?.articleCategory as string] ?? '')}
					</span>
					<h1>{boardArticle?.articleTitle}</h1>
					<div className={'ma-article__author'}>
						<img src={memberImage} alt={''} onClick={() => goMemberPage(boardArticle?.memberData?._id)} />
						<div>
							<strong onClick={() => goMemberPage(boardArticle?.memberData?._id)}>
								{boardArticle?.memberData?.memberNick}
							</strong>
							<span>
								{boardArticle?.createdAt && <Moment format={'DD MMM YYYY, HH:mm'}>{boardArticle.createdAt}</Moment>}
							</span>
						</div>
						<div className={'ma-article__stats'}>
							<span>
								<RemoveRedEyeIcon /> {boardArticle?.articleViews}
							</span>
							<span>
								<ChatBubbleOutlineRoundedIcon /> {boardArticle?.articleComments}
							</span>
							<button
								className={`ma-icon-btn ${liked ? 'is-liked' : ''}`}
								disabled={likeLoading}
								onClick={() => likeBoArticleHandler(user, boardArticle?._id)}
							>
								{liked ? <ThumbUpAltIcon /> : <ThumbUpOffAltIcon />} {boardArticle?.articleLikes}
							</button>
						</div>
					</div>
					<div className={'ma-article__content'}>
						<ToastViewerComponent markdown={boardArticle?.articleContent} className={'ytb_play'} />
					</div>
				</article>

				<section className={'ma-panel ma-profile-section'}>
					<h2>
						{t('Comments')} <small>({total})</small>
					</h2>
					<div className={'ma-comment-form'}>
						<textarea
							placeholder={t('Write a comment...') as string}
							value={comment}
							maxLength={100}
							onChange={(e) => {
								setWordsCnt(e.target.value.length);
								setComment(e.target.value);
							}}
						></textarea>
						<div className={'ma-comment-form__foot'}>
							<span>{wordsCnt}/100</span>
							<button
								className={'ma-btn ma-btn--primary'}
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
							<div className={'ma-comment'} key={commentData?._id}>
								<img
									src={getCommentMemberImage(commentData?.memberData?.memberImage)}
									alt={''}
									onClick={() => goMemberPage(commentData?.memberData?._id as string)}
								/>
								<div style={{ flex: 1 }}>
									<div className={'ma-comment__head'}>
										<strong onClick={() => goMemberPage(commentData?.memberData?._id as string)}>
											{commentData?.memberData?.memberNick}
										</strong>
										<span>
											<Moment format={'DD MMM YYYY, HH:mm'}>{commentData?.createdAt}</Moment>
										</span>
										{isMine && !editing && (
											<span className={'ma-comment__actions'}>
												<button
													className={'ma-link-btn'}
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
													className={'ma-link-btn ma-link-btn--danger'}
													onClick={() => updateButtonHandler(commentData?._id, CommentStatus.DELETE)}
												>
													{t('Delete')}
												</button>
											</span>
										)}
									</div>
									{editing ? (
										<div className={'ma-comment-form'}>
											<textarea
												value={updatedComment}
												onChange={(e) => updateCommentInputHandler(e.target.value)}
											></textarea>
											<div className={'ma-comment-form__foot'}>
												<span>{updatedCommentWordsCnt}/100</span>
												<div>
													<button className={'ma-btn ma-btn--outline'} onClick={cancelButtonHandler}>
														{t('Cancel')}
													</button>{' '}
													<button
														className={'ma-btn ma-btn--primary'}
														onClick={() => updateButtonHandler(updatedCommentId, undefined)}
													>
														{t('Save')}
													</button>
												</div>
											</div>
										</div>
									) : (
										<p>{commentData?.commentContent}</p>
									)}
								</div>
							</div>
						);
					})}

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
				</section>
			</div>
		</div>
	);
};

CommunityDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: '' },
	},
};

export default withLayoutFull(CommunityDetail);
