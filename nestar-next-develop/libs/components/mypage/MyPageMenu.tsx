import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryIcon from '@mui/icons-material/History';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import Badge from '../ui/Badge';
import { ButtonLink } from '../ui/Button';
import { cx } from '../ui/classNames';
import { unreadMessagesVar, userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { sweetConfirmAlert } from '../../sweetAlert';
import { formatPhone, imageUrl } from '../../utils';

interface MenuItem {
	key: string;
	label: string;
	icon: React.ReactNode;
	badge?: number;
}

// phones: a pill in a scrollable row; from 900px: a full-width row of the side menu
const itemClasses = cx(
	'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-2 font-sans text-[13px] font-medium whitespace-nowrap transition-colors [&_svg]:text-[18px]!',
	'md:w-full md:gap-2.5 md:rounded-[10px] md:border-0 md:p-2.5 md:text-sm md:[&_svg]:text-[20px]!',
);

const MyPageMenu = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const unread = useReactiveVar(unreadMessagesVar);
	const activeKey = (router.query?.category as string) ?? 'myProfile';
	const canSell = user?.memberType !== 'ADMIN';

	const groups: { title: string; items: MenuItem[] }[] = [
		{
			title: 'Listings',
			items: [
				...(canSell
					? [
							{ key: 'addProperty', label: 'Add Car', icon: <AddCircleOutlineIcon /> },
							{ key: 'myProperties', label: 'My Cars', icon: <DirectionsCarOutlinedIcon /> },
					  ]
					: []),
				{ key: 'messages', label: 'Messages', icon: <ChatBubbleOutlineIcon />, badge: unread },
				{ key: 'savedSearches', label: 'Saved searches', icon: <NotificationsActiveOutlinedIcon /> },
				{ key: 'myFavorites', label: 'My Favorites', icon: <FavoriteBorderIcon /> },
				{ key: 'recentlyVisited', label: 'Recently Visited', icon: <HistoryIcon /> },
			],
		},
		{
			title: 'Community',
			items: [
				{ key: 'myArticles', label: 'My Articles', icon: <ArticleOutlinedIcon /> },
				{ key: 'writeArticle', label: 'Write Article', icon: <EditNoteOutlinedIcon /> },
			],
		},
		{
			title: 'Account',
			items: [
				{ key: 'myProfile', label: 'My Profile', icon: <PersonOutlineIcon /> },
				{ key: 'followers', label: 'Followers', icon: <GroupOutlinedIcon /> },
				{ key: 'followings', label: 'Followings', icon: <PersonAddAltOutlinedIcon /> },
			],
		},
	];

	const logoutHandler = async () => {
		if (await sweetConfirmAlert(t('Do you want to logout?') as string)) logOut();
	};

	return (
		<aside
			className={cx(
				'flex items-center gap-1.5 overflow-x-auto rounded-md border border-line bg-white p-2 font-sans [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
				'md:sticky md:top-24 md:block md:overflow-visible md:p-[18px]',
			)}
		>
			<div className={'mb-2 hidden items-center gap-3 border-b border-line pb-4 md:flex'}>
				<img
					src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'}
					alt={user?.memberNick}
					className={'size-[52px] shrink-0 rounded-full bg-surface-alt object-cover'}
				/>
				<div className={'min-w-0'}>
					<strong className={'block truncate text-[15px] text-ink'}>{user?.memberFullName || user?.memberNick}</strong>
					<span className={'mt-0.5 mb-1.5 block text-xs text-muted'}>{formatPhone(user?.memberPhone)}</span>
					<Badge>
						{t(user?.memberType === 'AGENT' ? 'Dealer' : user?.memberType === 'ADMIN' ? 'Admin' : 'Private seller')}
					</Badge>
				</div>
			</div>

			{user?._id && (
				<div className={'mb-3.5 hidden md:block'}>
					<ButtonLink href={{ pathname: '/member', query: { memberId: user._id } }} variant={'outline'} block>
						{t('My public profile')}
					</ButtonLink>
				</div>
			)}

			{groups.map((group) => (
				<nav className={'flex shrink-0 gap-1.5 md:flex-col md:gap-0 md:py-2.5'} key={group.title} aria-label={t(group.title) as string}>
					<span className={'mb-1.5 ml-2.5 hidden text-[11px] font-bold tracking-[0.08em] text-faint uppercase md:block'}>
						{t(group.title)}
					</span>
					{group.items.map((item) => {
						const active = activeKey === item.key;
						return (
							<Link
								key={item.key}
								href={{ pathname: '/mypage', query: { category: item.key } }}
								scroll={false}
								aria-current={active ? 'page' : undefined}
								className={cx(
									itemClasses,
									active ? 'bg-primary-soft text-primary [&_svg]:text-primary' : 'text-text hover:bg-surface [&_svg]:text-muted',
								)}
							>
								{item.icon}
								{t(item.label)}
								{!!item.badge && (
									<em className={'ml-0.5 rounded-full bg-danger px-[7px] py-px text-xs font-semibold text-white not-italic md:ml-auto'}>
										{item.badge}
									</em>
								)}
							</Link>
						);
					})}
				</nav>
			))}

			<button
				type={'button'}
				onClick={logoutHandler}
				className={cx(
					itemClasses,
					'text-danger hover:bg-surface [&_svg]:text-danger md:mt-1.5 md:rounded-t-none md:border-t md:border-line md:pt-3.5',
				)}
			>
				<LogoutIcon />
				{t('Logout')}
			</button>
		</aside>
	);
};

export default MyPageMenu;
