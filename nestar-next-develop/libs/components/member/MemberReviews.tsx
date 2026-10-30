import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Pagination } from '@mui/material';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CommentGroup } from '../../enums/comment.enum';
import { Comment } from '../../types/comment/comment';
import { sweetErrorHandling } from '../../sweetAlert';
import ReviewItem from './ReviewItem';

const LIMIT = 5;

/** reviews other members leave on a seller's profile */
const MemberReviews = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query.memberId as string;
	const [page, setPage] = useState<number>(1);
	const [content, setContent] = useState<string>('');

	const { data, refetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { input: { page, limit: LIMIT, sort: 'createdAt', direction: 'DESC', search: { commentRefId: memberId } } },
	});
	const [createComment, { loading: sending }] = useMutation(CREATE_COMMENT);

	const reviews: Comment[] = data?.getComments?.list ?? [];
	const total: number = data?.getComments?.metaCounter?.[0]?.total ?? 0;
	const isOwnProfile = user?._id === memberId;

	const submitHandler = async () => {
		try {
			if (!user?._id) {
				await router.push('/account/join');
				return;
			}
			await createComment({
				variables: { input: { commentGroup: CommentGroup.MEMBER, commentContent: content.trim(), commentRefId: memberId } },
			});
			setContent('');
			setPage(1);
			await refetch();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Reviews')}</h1>
					<p>
						{total} {t('reviews')}
					</p>
				</div>
			</div>
			{!isOwnProfile && (
				<div className={'ma-comment-form'}>
					<textarea
						maxLength={1000}
						placeholder={t('Share your experience with this seller...') as string}
						value={content}
						onChange={({ target: { value } }) => setContent(value)}
					/>
					<button
						className={'ma-btn ma-btn--primary'}
						disabled={!!user?._id && (!content.trim() || sending)}
						onClick={submitHandler}
					>
						{user?._id ? t('Post review') : t('Login to comment')}
					</button>
				</div>
			)}
			{reviews.length ? (
				reviews.map((comment) => <ReviewItem comment={comment} key={comment._id} onRemoved={refetch} />)
			) : (
				<div className={'ma-empty'}>{t('No reviews yet.')}</div>
			)}
			{total > LIMIT && (
				<div className={'ma-pagination'}>
					<Pagination
						page={page}
						count={Math.ceil(total / LIMIT)}
						onChange={(e: unknown, value: number) => setPage(value)}
						shape="rounded"
					/>
				</div>
			)}
		</div>
	);
};

export default MemberReviews;
