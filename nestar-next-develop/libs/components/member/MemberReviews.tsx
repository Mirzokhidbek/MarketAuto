import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import Pagination from '../ui/Pagination';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CommentGroup } from '../../enums/comment.enum';
import { Comment } from '../../types/comment/comment';
import { sweetErrorHandling } from '../../sweetAlert';
import ReviewItem from './ReviewItem';
import { accountPanel, accountPanelHead, emptyBox, inputClass } from '../ui/styles';
import { buttonClasses } from '../ui/Button';

const LIMIT = 5;

/** reviews other members leave on a seller's profile */
const MemberReviews = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query.memberId as string;
	const [page, setPage] = useState<number>(1);
	const [content, setContent] = useState<string>('');

	const { data, refetch } = useQuery<any>(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { input: { page, limit: LIMIT, sort: 'createdAt', direction: 'DESC', search: { commentRefId: memberId } } },
	});
	const [createComment, { loading: sending }] = useMutation<any>(CREATE_COMMENT);

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
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Reviews')}</h1>
					<p>
						{total} {t('reviews')}
					</p>
				</div>
			</div>
			{!isOwnProfile && (
				<div className="mb-5 flex flex-col items-end gap-2.5">
					<textarea
						className={`${inputClass} h-auto! min-h-24 w-full resize-y py-3`}
						maxLength={1000}
						placeholder={t('Share your experience with this seller...') as string}
						value={content}
						onChange={({ target: { value } }) => setContent(value)}
					/>
					<button
						className={buttonClasses()}
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
				<div className={emptyBox}>{t('No reviews yet.')}</div>
			)}
			{total > LIMIT && (
				<Pagination page={page} total={total} pageSize={LIMIT} onChange={setPage} />
			)}
		</div>
	);
};

export default MemberReviews;
