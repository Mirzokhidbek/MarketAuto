import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { userVar } from '../../../apollo/store';

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
			href: signedIn ? '/mypage?category=addProperty' : '/account/join',
			label: t('Sell'),
			icon: <AddIcon />,
			active: onMyPage && category === 'addProperty',
			primary: true,
		},
		{
			href: signedIn ? '/mypage?category=myFavorites' : '/account/join',
			label: t('Favorites'),
			icon: <FavoriteBorderIcon />,
			active: onMyPage && category === 'myFavorites',
		},
		{
			href: signedIn ? '/mypage' : '/account/join',
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
