import { imageUrl } from '../../utils';
import React from 'react';
import { Stack, Typography } from '@mui/material';
import { Comment } from '../../types/comment/comment';
import { REACT_APP_API_URL } from '../../config';
import Moment from 'react-moment';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface ReviewItemProps {
	comment: Comment;
}

const ReviewItem = (props: ReviewItemProps) => {
	const { comment } = props;
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
		<div className={'ma-comment'}>
			<img src={imagePath} alt="" onClick={() => goMemberPage(comment?.memberData?._id as string)} />
			<div>
				<div className={'ma-comment__head'}>
					<strong onClick={() => goMemberPage(comment?.memberData?._id as string)}>{comment.memberData?.memberNick}</strong>
					<span>
						<Moment format={'DD MMM YYYY'}>{comment.createdAt}</Moment>
					</span>
				</div>
				<p>{comment.commentContent}</p>
			</div>
		</div>
	);
};

export default ReviewItem;
