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
		<div className="font-sans">
			<Link
				href={mypage('myProfile')}
				className="relative -mx-4 -mt-6 flex items-center gap-3.5 rounded-b-3xl bg-[radial-gradient(360px_200px_at_100%_0%,rgba(255,255,255,0.18),transparent_70%),linear-gradient(150deg,#0b4fd6,#2f7bff)] px-5 pt-7 pb-[52px] text-white"
			>
				<img
					className="size-16 shrink-0 rounded-full border-[3px] border-white/90 bg-white object-cover"
					src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'}
					alt={user?.memberNick}
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
					<strong className="overflow-hidden text-lg font-bold text-ellipsis whitespace-nowrap">{user?.memberFullName || user?.memberNick}</strong>
					{user?.memberPhone && <span className="text-sm opacity-90">{formatPhone(user.memberPhone)}</span>}
					{user?.memberPhoneVerified && (
						<em className="mt-1 inline-flex items-center gap-1 text-xs not-italic opacity-95">
							<VerifiedIcon className="text-base" /> {t('Verified user')}
						</em>
					)}
				</div>
				<ChevronRightIcon className="text-white opacity-90" />
			</Link>

			<div className="relative mx-1 -mt-8 mb-4 grid grid-cols-3 rounded-2xl bg-white py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.1)] [&>a]:flex [&>a]:flex-col [&>a]:items-center [&>a]:gap-1 [&>a]:text-ink [&>a:not(:first-child)]:border-l [&>a:not(:first-child)]:border-line [&_span]:text-xs [&_span]:text-muted [&_strong]:text-[17px] [&_strong]:font-bold">
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

			<nav className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
				{items.map((item) => (
					<Link key={item.href} href={item.href.startsWith('/') ? item.href : mypage(item.href)} className="flex min-h-[54px] items-center gap-3.5 pr-3.5 pl-4 text-[15px] text-ink [-webkit-tap-highlight-color:transparent] not-last:border-b not-last:border-line active:bg-[#f1f3f6] [&>svg:first-child]:text-[22px] [&>svg:first-child]:text-muted">
						{item.icon}
						<span className="flex-1">{t(item.label)}</span>
						{!!item.badge && <em className="min-w-[22px] rounded-full bg-[#c62828] px-[7px] py-0.5 text-center text-xs font-semibold text-white not-italic">{item.badge}</em>}
						<ChevronRightIcon className="text-faint" />
					</Link>
				))}
			</nav>

			<button type={'button'} className="mt-4 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border-0 bg-[#fef2f2] font-sans text-[15px] font-semibold text-[#c62828] [&_svg]:text-xl" onClick={logoutHandler}>
				<LogoutIcon /> {t('Logout')}
			</button>
		</div>
	);
};

export default ProfileHub;
