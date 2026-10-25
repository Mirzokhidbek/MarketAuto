import React, { ChangeEvent, useEffect, useState } from 'react';
import { Pagination } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { FollowInquiry } from '../../types/follow/follow.input';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Follower } from '../../types/follow/follow';
import { REACT_APP_API_URL } from '../../config';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { GET_MEMBER_FOLLOWERS } from '../../../apollo/user/query';

interface MemberFollowsProps {
	initialInput: FollowInquiry;
	subscribeHandler: any;
	unsubscribeHandler: any;
	likeMemberHandler: any;
	redirectToMemberPageHandler: any;
}

const MemberFollowers = (props: MemberFollowsProps) => {
	const { initialInput, subscribeHandler, unsubscribeHandler, likeMemberHandler, redirectToMemberPageHandler } = props;
	const { t } = useTranslation('common');
	const router = useRouter();
	const [total, setTotal] = useState<number>(0);
	const category: any = router.query?.category ?? 'properties';
	const [followInquiry, setFollowInquiry] = useState<FollowInquiry>(initialInput);
	const [memberFollowers, setMemberFollowers] = useState<Follower[]>([]);
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const {
		loading: getMemberFollowersLoading,
		data: getMemberFollowersData,
		error: getMemberFollowersError,
		refetch: getMemberFollowersRefetch,
	} = useQuery(GET_MEMBER_FOLLOWERS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		skip: !followInquiry?.search?.followingId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberFollowers(data?.getMemberFollowers?.list);
			setTotal(data?.getMemberFollowers?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.memberId)
			setFollowInquiry({ ...followInquiry, search: { followingId: router.query.memberId as string } });
		else setFollowInquiry({ ...followInquiry, search: { followingId: user?._id } });
	}, [router]);

	useEffect(() => {
		getMemberFollowersRefetch({ input: followInquiry }).then();
	}, [followInquiry]);

	/** HANDLERS **/
	const paginationHandler = async (event: ChangeEvent<unknown>, value: number) => {
		followInquiry.page = value;
		setFollowInquiry({ ...followInquiry });
	};

	return (
		<div id="member-follows-page" className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Followers')}</h1>
					<p>
						{total || 0} {t('people')}
					</p>
				</div>
			</div>
			{memberFollowers?.length ? (
				<div className={'ma-people'}>
					{memberFollowers.map((follower: any) => {
						const person = follower?.followerData;
						const liked = !!(follower?.meLiked && follower?.meLiked[0]?.myFavorite);
						const following = !!(follower?.meFollowed && follower?.meFollowed[0]?.myFollowing);
						return (
							<div className={'ma-person'} key={follower._id}>
								<img
									src={
										person?.memberImage ? `${REACT_APP_API_URL}/${person?.memberImage}` : '/img/profile/defaultUser.svg'
									}
									alt={person?.memberNick}
									onClick={() => redirectToMemberPageHandler(person?._id)}
								/>
								<div className={'ma-person__info'} onClick={() => redirectToMemberPageHandler(person?._id)}>
									<strong>{person?.memberNick}</strong>
									<span>
										{person?.memberFollowers} {t('followers')} · {person?.memberFollowings} {t('followings')}
									</span>
								</div>
								<button
									className={`ma-icon-btn ${liked ? 'is-liked' : ''}`}
									onClick={() => likeMemberHandler(person?._id, getMemberFollowersRefetch, followInquiry)}
								>
									{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {person?.memberLikes}
								</button>
								{user?._id && user?._id !== follower?.followerId && (
									<button
										className={`ma-btn ${following ? 'ma-btn--outline' : 'ma-btn--primary'}`}
										onClick={() =>
											following
												? unsubscribeHandler(person?._id, getMemberFollowersRefetch, followInquiry)
												: subscribeHandler(person?._id, getMemberFollowersRefetch, followInquiry)
										}
									>
										{following ? t('Unfollow') : t('Follow')}
									</button>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<div className={'ma-empty'}>{t('No followers yet.')}</div>
			)}
			{total > followInquiry.limit && (
				<div className={'ma-pagination'}>
					<Pagination
						page={followInquiry.page}
						count={Math.ceil(total / followInquiry.limit)}
						onChange={paginationHandler}
						shape="rounded"
					/>
				</div>
			)}
		</div>
	);
};

MemberFollowers.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		search: {
			followingId: '',
		},
	},
};

export default MemberFollowers;
