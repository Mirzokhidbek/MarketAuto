import SellerTrust from '../seller/SellerTrust';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';
import { GET_MEMBER } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { formatPhone, imageUrl } from '../../utils';
import Seo from '../common/Seo';
import { CarIcon as DirectionsCarOutlinedIcon, GroupIcon as GroupOutlinedIcon, PersonAddIcon as PersonAddAltOutlinedIcon, ArticleIcon as ArticleOutlinedIcon, RateReviewIcon as RateReviewOutlinedIcon } from '../ui/icons';
import { buttonClasses } from '../ui/Button';
import Badge from '../ui/Badge';
import { cx } from '../ui/classNames';

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
	const { data: completedData1, refetch: getMemberRefetch } = useQuery<any>(GET_MEMBER, {
		fetchPolicy: 'network-only',
		variables: { input: memberId },
		skip: !memberId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!completedData1) return;
		const data: any = completedData1;
		setMember(data?.getMember);
	}, [completedData1]);

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
		<aside className="rounded-[10px] border border-line bg-white p-[18px] font-sans shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:sticky md:top-24">
			{member && (
				<Seo
					title={member.memberFullName || member.memberNick}
					description={member.memberDesc || undefined}
					image={member.memberImage ? imageUrl(member.memberImage) : undefined}
				/>
			)}
			<div className="flex flex-col items-center gap-1.5 border-b border-line pb-4 text-center [&>a]:mt-1 [&>a]:w-full [&>button]:mt-1 [&>button]:w-full">
				<img
					src={member?.memberImage ? imageUrl(member?.memberImage) : '/img/profile/defaultUser.svg'}
					alt={member?.memberNick}
					className="mb-1.5 size-[88px] rounded-full bg-[#f1f3f6] object-cover"
				/>
				<strong className="text-[17px] text-ink">{member?.memberFullName || member?.memberNick}</strong>
				<Badge>
					{t(member?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}
				</Badge>
				{member?.memberPhone && <span className="text-[13px] text-muted">{formatPhone(member?.memberPhone)}</span>}
				<SellerTrust member={member} />
				{member?.memberDesc && <p className="m-0 mt-1 text-[13px] leading-normal text-muted">{member.memberDesc}</p>}
				{user?._id && user?._id === member?._id && (
					<>
						<Link href={'/mypage?category=addProperty'} className={buttonClasses({ block: true, className: 'mt-2.5' })}>
							{t('Add Car')}
						</Link>
						<Link href={'/mypage?category=myProfile'} className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })}>
							{t('Edit profile')}
						</Link>
					</>
				)}
				{!user?._id && (
					<button className={buttonClasses({ block: true, className: 'mt-2.5' })} onClick={() => router.push('/account/join')}>
						{t('Follow')}
					</button>
				)}
				{user?._id && member?._id && user?._id !== member?._id && (
					<Link href={`/mypage?category=messages&to=${member._id}`} className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })}>
						{t('Write a message')}
					</Link>
				)}
				{user?._id && user?._id !== member?._id && (
					<button
						className={buttonClasses({ variant: following ? 'outline' : 'primary', block: true, className: 'mt-2.5' })}
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
			<nav className="flex flex-col py-2.5">
				{items.map((item) => (
					<Link
						href={{ pathname: router.pathname, query: { ...router.query, category: item.key } }}
						scroll={false}
						key={item.key}
					>
						<span
							className={cx(
								'flex w-full items-center gap-2.5 rounded-[10px] p-2.5 text-sm font-medium transition-colors [&_svg]:text-xl',
								category === item.key ? 'bg-[#eff6ff] text-primary [&_svg]:text-primary' : 'text-text hover:bg-surface [&_svg]:text-muted',
							)}
						>
							{item.icon}
							{t(item.label)}
							<em className="ml-auto text-xs text-muted not-italic">{item.count ?? 0}</em>
						</span>
					</Link>
				))}
			</nav>
		</aside>
	);
};

export default MemberMenu;
