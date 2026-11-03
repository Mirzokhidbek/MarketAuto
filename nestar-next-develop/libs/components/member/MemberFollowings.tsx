import { imageUrl } from '../../utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { useRouter } from 'next/router';
import { FollowInquiry } from '../../types/follow/follow.input';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { Following } from '../../types/follow/follow';
import { REACT_APP_API_URL } from '../../config';
import { userVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { FavoriteIcon, FavoriteBorderIcon } from '../ui/icons';
import { buttonClasses } from '../ui/Button';
import { accountPanel, accountPanelHead, emptyBox, iconButton } from '../ui/styles';
import Pagination from '../ui/Pagination';

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
	} = useQuery<any>(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		variables: { input: followInquiry },
		skip: !followInquiry?.search?.followerId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getMemberFollowingsData) return;
		const data: any = getMemberFollowingsData;
		setMemberFollowings(data?.getMemberFollowings?.list);
		setTotal(data?.getMemberFollowings?.metaCounter[0]?.total);
	}, [getMemberFollowingsData]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.memberId)
			setFollowInquiry({ ...followInquiry, search: { followerId: router.query.memberId as string } });
		else setFollowInquiry({ ...followInquiry, search: { followerId: user?._id } });
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
					<h1>{t('Followings')}</h1>
					<p>
						{total || 0} {t('people')}
					</p>
				</div>
			</div>
			{memberFollowings?.length ? (
				<div className="flex flex-col gap-2.5">
					{memberFollowings.map((following: any) => {
						const person = following?.followingData;
						const liked = !!(following?.meLiked && following?.meLiked[0]?.myFavorite);
						const isFollowing = !!(following?.meFollowed && following?.meFollowed[0]?.myFollowing);
						return (
							<div className="flex items-center gap-3.5 rounded-xl border border-line px-3.5 py-3 max-sm:flex-wrap" key={following._id}>
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
									onClick={() => likeMemberHandler(person?._id, getMemberFollowingsRefetch, followInquiry)}
								>
									{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />} {person?.memberLikes}
								</button>
								{user?._id && user?._id !== following?.followingId && (
									<button
										className={buttonClasses({ variant: isFollowing ? 'outline' : 'primary' })}
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
				<div className={emptyBox}>{t('Not following anyone yet.')}</div>
			)}
			{total > followInquiry.limit && (
				<Pagination page={followInquiry.page} total={total} pageSize={followInquiry.limit} onChange={paginationHandler} />
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
