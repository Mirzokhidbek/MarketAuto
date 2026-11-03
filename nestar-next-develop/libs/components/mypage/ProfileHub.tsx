import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { unreadMessagesVar, unreadNotificationsVar, userVar } from '../../../apollo/store';
import { GET_FAVORITES } from '../../../apollo/user/query';
import { logOut } from '../../auth';
import { sweetConfirmAlert } from '../../sweetAlert';
import { formatPhone, imageUrl } from '../../utils';
import { ChevronRightIcon, VerifiedIcon, CarIcon as DirectionsCarOutlinedIcon, FavoriteBorderIcon, ChatIcon as ChatBubbleOutlineIcon, BellIcon as NotificationsNoneOutlinedIcon, BellRingIcon as NotificationsActiveOutlinedIcon, HistoryIcon, SettingsIcon as SettingsOutlinedIcon, AdminIcon as AdminPanelSettingsOutlinedIcon, HelpIcon as HelpOutlineIcon, InfoIcon as InfoOutlinedIcon, LogoutIcon } from '../ui/icons';

interface HubItem {
	href: string;
	label: string;
	icon: React.ReactNode;
	badge?: number;
}

const mypage = (category: string) => ({ pathname: '/mypage', query: { category } });

/** phones: the "Profile" tab — who I am, my numbers, and every section of my page as a list */
const ProfileHub = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const unread = useReactiveVar(unreadMessagesVar);
	const unreadNotifications = useReactiveVar(unreadNotificationsVar);
	const isAdmin = user?.memberType === 'ADMIN';

	// only the count is needed
	const { data } = useQuery<any>(GET_FAVORITES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1 } },
		skip: !user?._id,
	});
	const favorites = data?.getFavorites?.metaCounter?.[0]?.total ?? 0;

	const items: HubItem[] = [
		...(isAdmin ? [{ href: '/_admin', label: 'Admin panel', icon: <AdminPanelSettingsOutlinedIcon /> }] : []),
		...(!isAdmin ? [{ href: 'myProperties', label: 'My Cars', icon: <DirectionsCarOutlinedIcon /> }] : []),
		{ href: 'myFavorites', label: 'My Favorites', icon: <FavoriteBorderIcon /> },
		{ href: 'messages', label: 'Messages', icon: <ChatBubbleOutlineIcon />, badge: unread },
		{ href: 'notifications', label: 'Notifications', icon: <NotificationsNoneOutlinedIcon />, badge: unreadNotifications },
		{ href: 'savedSearches', label: 'Saved searches', icon: <NotificationsActiveOutlinedIcon /> },
		{ href: 'recentlyVisited', label: 'Recently Visited', icon: <HistoryIcon /> },
		{ href: 'myProfile', label: 'Profile settings', icon: <SettingsOutlinedIcon /> },
		{ href: '/cs', label: 'Help and support', icon: <HelpOutlineIcon /> },
		{ href: '/about', label: 'About the app', icon: <InfoOutlinedIcon /> },
	];

	const logoutHandler = async () => {
		if (await sweetConfirmAlert(t('Do you want to logout?') as string)) logOut();
	};

	return (
		<div className={'ma-hub'}>
			<Link href={mypage('myProfile')} className={'ma-hub__card'}>
				<img
					className={'ma-hub__avatar'}
					src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'}
					alt={user?.memberNick}
				/>
				<div className={'ma-hub__who'}>
					<strong>{user?.memberFullName || user?.memberNick}</strong>
					{user?.memberPhone && <span>{formatPhone(user.memberPhone)}</span>}
					{user?.memberPhoneVerified && (
						<em>
							<VerifiedIcon /> {t('Verified user')}
						</em>
					)}
				</div>
				<ChevronRightIcon className={'ma-hub__chevron'} />
			</Link>

			<div className={'ma-hub__stats'}>
				<Link href={mypage('myProperties')}>
					<span>{t('My listings')}</span>
					<strong>{user?.memberProperties ?? 0}</strong>
				</Link>
				<Link href={mypage('myFavorites')}>
					<span>{t('Favorites')}</span>
					<strong>{favorites}</strong>
				</Link>
				<Link href={{ pathname: '/member', query: { memberId: user?._id } }}>
					<span>{t('Views')}</span>
					<strong>{(user?.memberViews ?? 0).toLocaleString('ru-RU')}</strong>
				</Link>
			</div>

			<nav className={'ma-hub__list'}>
				{items.map((item) => (
					<Link key={item.href} href={item.href.startsWith('/') ? item.href : mypage(item.href)} className={'ma-hub__item'}>
						{item.icon}
						<span>{t(item.label)}</span>
						{!!item.badge && <em className={'ma-hub__badge'}>{item.badge}</em>}
						<ChevronRightIcon className={'ma-hub__chevron'} />
					</Link>
				))}
			</nav>

			<button type={'button'} className={'ma-hub__logout'} onClick={logoutHandler}>
				<LogoutIcon /> {t('Logout')}
			</button>
		</div>
	);
};

export default ProfileHub;
