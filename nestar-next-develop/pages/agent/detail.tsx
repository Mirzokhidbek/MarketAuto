import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import CarCard from '../../libs/components/common/CarCard';
import Review from '../../libs/components/property/Review';
import { Pagination } from '@mui/material';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Property } from '../../libs/types/property/property';
import { Member } from '../../libs/types/member/member';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { PropertiesInquiry } from '../../libs/types/property/property.input';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Messages, REACT_APP_API_URL } from '../../libs/config';
import { formatPhone } from '../../libs/utils';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { CREATE_COMMENT, LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { GET_COMMENTS, GET_MEMBER, GET_PROPERTIES } from '../../apollo/user/query';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const AgentDetail: NextPage = ({ initialInput, initialComment, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [agentId, setAgentId] = useState<string | null>(null);
	const [agent, setAgent] = useState<Member | null>(null);
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(initialInput);
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [propertyTotal, setPropertyTotal] = useState<number>(0);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [agentComments, setAgentComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.MEMBER,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [createComment] = useMutation(CREATE_COMMENT);
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const {
		loading: getMemberLoading,
		data: getMemberData,
		error: getMemberError,
		refetch: getMemberRefetch,
	} = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: agentId },
		skip: !agentId,
		onCompleted: (data: T) => {
			setAgent(data?.getMember);
			setSearchFilter({
				...searchFilter,
				search: {
					memberId: data?.getMember?._id,
				},
			});
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentRefId: data?.getMember?._id,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: data?.getMember?._id,
			});
		},
	});

	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter.search.memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentProperties(data?.getProperties?.list);
			setPropertyTotal(data?.getProperties?.metaCounter[0]?.total ?? 0);
		},
	});

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: { input: commentInquiry },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.agentId) setAgentId(router.query.agentId as string);
	}, [router]);

	useEffect(() => {
		if (searchFilter.search.memberId) {
			getPropertiesRefetch({ input: searchFilter }).then();
		}
	}, [searchFilter]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			getCommentsRefetch({ input: commentInquiry }).then();
		}
	}, [commentInquiry]);

	/** HANDLERS **/
	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	const propertyPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		setSearchFilter({ ...searchFilter });
	};

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			if (user._id === agentId) throw new Error('Cannot write a review for yourself');
			await createComment({
				variables: {
					input: insertCommentData,
				},
			});

			setInsertCommentData({ ...insertCommentData, commentContent: '' });
			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likePropertyHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetProperty({
				variables: {
					input: id,
				},
			});
			await getPropertiesRefetch({ input: searchFilter });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			console.log('ERROR, likePropertyHandler:', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!agent) {
		return (
			<div className={'ma-page ma-list-page'}>
				<div className={'ma-container'}>
					<div className={'ma-empty'}>{t('Loading...')}</div>
				</div>
			</div>
		);
	}

	return (
		<div className={'ma-page ma-profile-page'}>
			<div className={'ma-container'}>
				<section className={'ma-profile-card'}>
					<div className={'ma-profile-card__cover'} />
					<div className={'ma-profile-card__body'}>
						<img
							className={'ma-profile-card__avatar'}
							src={agent.memberImage ? `${REACT_APP_API_URL}/${agent.memberImage}` : '/img/profile/defaultUser.svg'}
							alt={agent.memberNick}
						/>
						<div className={'ma-profile-card__info'}>
							<span className={'ma-badge ma-badge--primary'}>{t('Dealer')}</span>
							<h1>{agent.memberFullName || agent.memberNick}</h1>
							<div className={'ma-detail__meta'}>
								{agent.memberAddress && <span>{agent.memberAddress}</span>}
								<span>
									<PhoneOutlinedIcon /> {formatPhone(agent.memberPhone)}
								</span>
							</div>
							{agent.memberDesc && <p className={'ma-profile-card__desc'}>{agent.memberDesc}</p>}
						</div>
						<div className={'ma-profile-card__side'}>
							<div className={'ma-profile-card__stats'}>
								<div>
									<strong>{agent.memberProperties}</strong>
									<span>{t('cars')}</span>
								</div>
								<div>
									<strong>{agent.memberLikes}</strong>
									<span>{t('likes')}</span>
								</div>
								<div>
									<strong>{agent.memberViews}</strong>
									<span>{t('views')}</span>
								</div>
							</div>
							<a className={'ma-btn ma-btn--primary'} href={`tel:${formatPhone(agent.memberPhone)}`}>
								<PhoneOutlinedIcon /> {t('Call dealer')}
							</a>
							<button className={'ma-btn ma-btn--outline'} onClick={() => redirectToMemberPageHandler(agent._id)}>
								{t('Followers & articles')}
							</button>
						</div>
					</div>
				</section>

				<section className={'ma-profile-section'}>
					<div className={'ma-results__bar'}>
						<div>
							<h2>{t('Cars from this dealer')}</h2>
							<span>
								{propertyTotal} {t('cars found')}
							</span>
						</div>
					</div>
					{agentProperties.length ? (
						<div className={'ma-grid ma-grid--3'}>
							{agentProperties.map((property: Property) => (
								<CarCard property={property} key={property._id} onLike={(id) => likePropertyHandler(user, id)} />
							))}
						</div>
					) : (
						<div className={'ma-empty'}>{t('This dealer has no cars yet.')}</div>
					)}
					{propertyTotal > searchFilter.limit && (
						<div className={'ma-pagination'}>
							<Pagination
								page={searchFilter.page}
								count={Math.ceil(propertyTotal / searchFilter.limit)}
								onChange={propertyPaginationChangeHandler}
								shape="rounded"
							/>
						</div>
					)}
				</section>

				<section className={'ma-panel ma-profile-section'}>
					<h2>
						{t('Reviews')} <small>({commentTotal})</small>
					</h2>
					<div className={'ma-comment-form'}>
						<textarea
							placeholder={t('Share your experience with this dealer...') as string}
							value={insertCommentData.commentContent}
							onChange={({ target: { value } }: any) =>
								setInsertCommentData({ ...insertCommentData, commentContent: value })
							}
						></textarea>
						<button
							className={'ma-btn ma-btn--primary'}
							disabled={insertCommentData.commentContent === '' || !user?._id}
							onClick={createCommentHandler}
						>
							{user?._id ? t('Post review') : t('Login to comment')}
						</button>
					</div>
					{agentComments.map((comment: Comment) => (
						<Review comment={comment} key={comment._id} />
					))}
					{commentTotal > commentInquiry.limit && (
						<div className={'ma-pagination'}>
							<Pagination
								page={commentInquiry.page}
								count={Math.ceil(commentTotal / commentInquiry.limit)}
								onChange={commentPaginationChangeHandler}
								shape="rounded"
							/>
						</div>
					)}
				</section>
			</div>
		</div>
	);
};

AgentDetail.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		search: {
			memberId: '',
		},
	},
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentRefId: '',
		},
	},
};

export default withLayoutFull(AgentDetail);
