import { imageUrl } from '../../utils';
import React from 'react';
import { Comment } from '../../types/comment/comment';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client/react';
import { userVar } from '../../../apollo/store';
import AdminRemoveComment from '../admin/AdminRemoveComment';
import { formatDate } from '../../date';

interface ReviewItemProps {
	comment: Comment;
	/** reload the reviews after an admin removed one */
	onRemoved?: () => unknown;
}

const ReviewItem = (props: ReviewItemProps) => {
	const { comment, onRemoved } = props;
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const imagePath: string = comment?.memberData?.memberImage
		? imageUrl(comment?.memberData?.memberImage)
		: '/img/profile/defaultUser.svg';

	/** HANDLERS **/
	const goMemberPage = (id: string) => {
		router.push(`/member?memberId=${id}`);
	};
	return (
		<div className="flex gap-3.5 border-t border-line py-4 font-sans">
			<img src={imagePath} alt="" className="size-10 shrink-0 cursor-pointer rounded-full object-cover" onClick={() => goMemberPage(comment?.memberData?._id as string)} />
			<div>
				<div className="mb-1 flex items-center gap-2.5">
					<strong className="cursor-pointer text-sm text-ink" onClick={() => goMemberPage(comment?.memberData?._id as string)}>{comment.memberData?.memberNick}</strong>
					<span className="text-xs text-muted">
						{formatDate(comment.createdAt, 'DD MMM YYYY')}
					</span>
					{onRemoved && (
						<span className="ml-auto inline-flex gap-2.5">
							<AdminRemoveComment commentId={comment._id} onRemoved={onRemoved} />
						</span>
					)}
				</div>
				<p className="m-0 text-sm leading-[1.6] text-text">{comment.commentContent}</p>
			</div>
		</div>
	);
};

export default ReviewItem;
