import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { userVar } from '../../../apollo/store';
import { joinHref } from '../../utils';
import { HomeIcon as HomeOutlinedIcon, SearchIcon, AddIcon, FavoriteBorderIcon, PersonIcon as PersonOutlineIcon } from '../ui/icons';

/** phones only: app-style bottom navigation for the main destinations */
const MobileTabBar = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const signedIn = !!user?._id;
	const category = router.query?.category as string | undefined;
	const onMyPage = router.pathname === '/mypage';

	// guests are sent to sign in for anything that needs an account
	const tabs = [
		{ href: '/', label: t('Home'), icon: <HomeOutlinedIcon />, active: router.pathname === '/' },
		{
			href: '/property',
			label: t('Cars'),
			icon: <SearchIcon />,
			active: router.pathname.startsWith('/property'),
		},
		{
			href: signedIn ? '/mypage?category=addProperty' : joinHref('/mypage?category=addProperty'),
			label: t('Sell'),
			icon: <AddIcon />,
			active: onMyPage && category === 'addProperty',
			primary: true,
		},
		{
			href: signedIn ? '/mypage?category=myFavorites' : joinHref('/mypage?category=myFavorites'),
			label: t('Favorites'),
			icon: <FavoriteBorderIcon />,
			active: onMyPage && category === 'myFavorites',
		},
		{
			href: signedIn ? '/mypage' : joinHref('/mypage'),
			label: t('Profile'),
			icon: <PersonOutlineIcon />,
			active:
				router.pathname === '/account/join' || (onMyPage && category !== 'addProperty' && category !== 'myFavorites'),
		},
	];

	return (
		<nav className={'ma-tabbar'} aria-label={t('Main navigation') as string}>
			{tabs.map((tab) => (
				<Link
					key={tab.label}
					href={tab.href}
					className={`ma-tabbar__item ${tab.primary ? 'ma-tabbar__item--primary' : ''} ${
						tab.active ? 'is-active' : ''
					}`}
					aria-current={tab.active ? 'page' : undefined}
				>
					<span className={'ma-tabbar__icon'}>{tab.icon}</span>
					<span className={'ma-tabbar__label'}>{tab.label}</span>
				</Link>
			))}
		</nav>
	);
};

export default MobileTabBar;
