import { imageUrl } from '../../utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useRouter } from 'next/router';
import { FollowInquiry } from '../../types/follow/follow.input';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { Follower } from '../../types/follow/follow';
import { REACT_APP_API_URL } from '../../config';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { GET_MEMBER_FOLLOWERS } from '../../../apollo/user/query';
import { FavoriteIcon, FavoriteBorderIcon } from '../ui/icons';
import { buttonClasses } from '../ui/Button';
import { accountPanel, accountPanelHead, emptyBox, iconButton } from '../ui/styles';
import Pagination from '../ui/Pagination';

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
	} = useQuery<any>(GET_MEMBER_FOLLOWERS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		skip: !followInquiry?.search?.followingId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getMemberFollowersData) return;
		const data: any = getMemberFollowersData;
		setMemberFollowers(data?.getMemberFollowers?.list);
		setTotal(data?.getMemberFollowers?.metaCounter[0]?.total);
	}, [getMemberFollowersData]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.memberId)
			setFollowInquiry({ ...followInquiry, search: { followingId: router.query.memberId as string } });
		else setFollowInquiry({ ...followInquiry, search: { followingId: user?._id } });
	}, [router]);

	/** HANDLERS **/
	const paginationHandler = async (value: number) => {
		followInquiry.page = value;
		setFollowInquiry({ ...followInquiry });
	};

	return (
		<div id="member-follows-page" className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Followers')}</h1>
					<p>
						{total || 0} {t('people')}
					</p>
				</div>
			</div>
			{memberFollowers?.length ? (
				<div className="flex flex-col gap-2.5">
					{memberFollowers.map((follower: any) => {
						const person = follower?.followerData;
						const liked = !!(follower?.meLiked && follower?.meLiked[0]?.myFavorite);
						const following = !!(follower?.meFollowed && follower?.meFollowed[0]?.myFollowing);
						return (
							<div className="flex items-center gap-3.5 rounded-xl border border-line px-3.5 py-3 max-sm:flex-wrap" key={follower._id}>
								<img
									src={person?.memberImage ? imageUrl(person?.memberImage) : '/img/profile/defaultUser.svg'}
									alt={person?.memberNick}
									className="size-12 cursor-pointer rounded-full object-cover"
									onClick={() => redirectToMemberPageHandler(person?._id)}
								/>
								<div className="flex-1 cursor-pointer" onClick={() => redirectToMemberPageHandler(person?._id)}>
									<strong className="block text-[15px] text-ink">{person?.memberNick}</strong>
									<span className="text-[13px] text-muted">
										{person?.memberFollowers} {t('followers')} · {person?.memberFollowings} {t('followings')}
									</span>
								</div>
								<button
									className={`${iconButton} ${liked ? '[&_svg]:text-[#c62828]' : ''}`}
									onClick={() => likeMemberHandler(person?._id, getMemberFollowersRefetch, followInquiry)}
								>
									{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {person?.memberLikes}
								</button>
								{user?._id && user?._id !== follower?.followerId && (
									<button
										className={buttonClasses({ variant: following ? 'outline' : 'primary' })}
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
				<div className={emptyBox}>{t('No followers yet.')}</div>
			)}
			{total > followInquiry.limit && (
				<Pagination page={followInquiry.page} total={total} pageSize={followInquiry.limit} onChange={paginationHandler} />
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
