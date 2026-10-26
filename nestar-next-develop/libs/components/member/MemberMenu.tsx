import SellerTrust from '../common/SellerTrust';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { GET_MEMBER } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { formatPhone, imageUrl } from '../../utils';
import Seo from '../common/Seo';

interface MemberMenuProps {
	subscribeHandler: any;
	unsubscribeHandler: any;
}

const MemberMenu = (props: MemberMenuProps) => {
	const { subscribeHandler, unsubscribeHandler } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const category: any = router.query?.category;
	const [member, setMember] = useState<Member | null>(null);
	const { memberId } = router.query;

	/** APOLLO REQUESTS **/
	const { refetch: getMemberRefetch } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMember(data?.getMember);
		},
	});

	const isSeller = member?.memberType !== 'ADMIN';
	const following = !!(member?.meFollowed && member?.meFollowed[0]?.myFollowing);
	const items = [
		...(isSeller
			? [{ key: 'properties', label: 'Cars', icon: <DirectionsCarOutlinedIcon />, count: member?.memberProperties }]
			: []),
		{ key: 'followers', label: 'Followers', icon: <GroupOutlinedIcon />, count: member?.memberFollowers },
		{ key: 'followings', label: 'Followings', icon: <PersonAddAltOutlinedIcon />, count: member?.memberFollowings },
		{ key: 'articles', label: 'Articles', icon: <ArticleOutlinedIcon />, count: member?.memberArticles },
		{ key: 'reviews', label: 'Reviews', icon: <RateReviewOutlinedIcon />, count: member?.memberComments },
	];

	return (
		<aside className={'ma-side-menu'}>
			{member && (
				<Seo
					title={member.memberFullName || member.memberNick}
					description={member.memberDesc || undefined}
					image={member.memberImage ? imageUrl(member.memberImage) : undefined}
				/>
			)}
			<div className={'ma-side-menu__profile'}>
				<img
					src={member?.memberImage ? imageUrl(member?.memberImage) : '/img/profile/defaultUser.svg'}
					alt={member?.memberNick}
				/>
				<strong>{member?.memberFullName || member?.memberNick}</strong>
				<span className={'ma-badge ma-badge--primary'}>{t(member?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</span>
				{member?.memberPhone && <span className={'ma-side-menu__phone'}>{formatPhone(member?.memberPhone)}</span>}
				<SellerTrust member={member} />
				{member?.memberDesc && <p>{member.memberDesc}</p>}
				{user?._id && user?._id === member?._id && (
					<>
						<Link href={'/mypage?category=addProperty'}>
							<span className={'ma-btn ma-btn--block ma-btn--primary'}>{t('Add Car')}</span>
						</Link>
						<Link href={'/mypage?category=myProfile'}>
							<span className={'ma-btn ma-btn--block ma-btn--outline'}>{t('Edit profile')}</span>
						</Link>
					</>
				)}
				{!user?._id && (
					<button className={'ma-btn ma-btn--block ma-btn--primary'} onClick={() => router.push('/account/join')}>
						{t('Follow')}
					</button>
				)}
				{user?._id && member?._id && user?._id !== member?._id && (
					<Link href={`/mypage?category=messages&to=${member._id}`}>
						<span className={'ma-btn ma-btn--block ma-btn--outline'}>{t('Write a message')}</span>
					</Link>
				)}
				{user?._id && user?._id !== member?._id && (
					<button
						className={`ma-btn ma-btn--block ${following ? 'ma-btn--outline' : 'ma-btn--primary'}`}
						onClick={() =>
							following
								? unsubscribeHandler(member?._id, getMemberRefetch, memberId)
								: subscribeHandler(member?._id, getMemberRefetch, memberId)
						}
					>
						{following ? t('Unfollow') : t('Follow')}
					</button>
				)}
			</div>
			<nav className={'ma-side-menu__group'}>
				{items.map((item) => (
					<Link
						href={{ pathname: router.pathname, query: { ...router.query, category: item.key } }}
						scroll={false}
						key={item.key}
					>
						<span className={`ma-side-menu__item ${category === item.key ? 'is-active' : ''}`}>
							{item.icon}
							{t(item.label)}
							<em className={'ma-side-menu__count'}>{item.count ?? 0}</em>
						</span>
					</Link>
				))}
			</nav>
		</aside>
	);
};

export default MemberMenu;
