import { imageUrl } from '../../utils';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Pagination } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { FollowInquiry } from '../../types/follow/follow.input';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Following } from '../../types/follow/follow';
import { REACT_APP_API_URL } from '../../config';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';

interface MemberFollowingsProps {
	initialInput: FollowInquiry;
	subscribeHandler: any;
	unsubscribeHandler: any;
	likeMemberHandler: any;
	redirectToMemberPageHandler: any;
}

const MemberFollowings = (props: MemberFollowingsProps) => {
	const { initialInput, subscribeHandler, unsubscribeHandler, likeMemberHandler, redirectToMemberPageHandler } = props;
	const { t } = useTranslation('common');
	const router = useRouter();
	const [total, setTotal] = useState<number>(0);
	const category: any = router.query?.category ?? 'properties';
	const [followInquiry, setFollowInquiry] = useState<FollowInquiry>(initialInput);
	const [memberFollowings, setMemberFollowings] = useState<Following[]>([]);
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const {
		loading: getMemberFollowingsLoading,
		data: getMemberFollowingsData,
		error: getMemberFollowersError,
		refetch: getMemberFollowingsRefetch,
	} = useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		skip: !followInquiry?.search?.followerId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMemberFollowings(data?.getMemberFollowings?.list);
			setTotal(data?.getMemberFollowings?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.memberId)
			setFollowInquiry({ ...followInquiry, search: { followerId: router.query.memberId as string } });
		else setFollowInquiry({ ...followInquiry, search: { followerId: user?._id } });
	}, [router]);

	useEffect(() => {
		getMemberFollowingsRefetch({ input: followInquiry }).then();
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
					<h1>{t('Followings')}</h1>
					<p>
						{total || 0} {t('people')}
					</p>
				</div>
			</div>
			{memberFollowings?.length ? (
				<div className={'ma-people'}>
					{memberFollowings.map((following: any) => {
						const person = following?.followingData;
						const liked = !!(following?.meLiked && following?.meLiked[0]?.myFavorite);
						const isFollowing = !!(following?.meFollowed && following?.meFollowed[0]?.myFollowing);
						return (
							<div className={'ma-person'} key={following._id}>
								<img
									src={
										person?.memberImage ? imageUrl(person?.memberImage) : '/img/profile/defaultUser.svg'
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
									onClick={() => likeMemberHandler(person?._id, getMemberFollowingsRefetch, followInquiry)}
								>
									{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {person?.memberLikes}
								</button>
								{user?._id && user?._id !== following?.followingId && (
									<button
										className={`ma-btn ${isFollowing ? 'ma-btn--outline' : 'ma-btn--primary'}`}
										onClick={() =>
											isFollowing
												? unsubscribeHandler(person?._id, getMemberFollowingsRefetch, followInquiry)
												: subscribeHandler(person?._id, getMemberFollowingsRefetch, followInquiry)
										}
									>
										{isFollowing ? t('Unfollow') : t('Follow')}
									</button>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<div className={'ma-empty'}>{t('Not following anyone yet.')}</div>
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

MemberFollowings.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		search: {
			followerId: '',
		},
	},
};

export default MemberFollowings;
