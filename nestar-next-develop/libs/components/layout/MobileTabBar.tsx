import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { userVar } from '../../../apollo/store';
import { joinHref } from '../../utils';
import { cx } from '../ui/classNames';
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
		<nav
			className={cx(
				'fixed inset-x-0 bottom-0 z-[1100] grid h-[calc(62px+env(safe-area-inset-bottom))] grid-cols-5 items-stretch border-t border-line bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] font-sans backdrop-blur-md backdrop-saturate-[1.8] sm:hidden',
				// the car page has its own call / write bar instead
				'[body:has(.ma-contact-bar)_&]:hidden',
			)}
			aria-label={t('Main navigation') as string}
		>
			{tabs.map((tab) => (
				<Link
					key={tab.label}
					href={tab.href}
					className={cx(
						'group flex min-w-0 flex-col items-center justify-center gap-[3px] [-webkit-tap-highlight-color:transparent]',
						tab.active ? 'text-primary' : tab.primary ? 'text-ink' : 'text-faint',
					)}
					aria-current={tab.active ? 'page' : undefined}
				>
					<span
						className={cx(
							'flex h-[30px] items-center justify-center text-2xl transition-transform group-active:scale-[0.92]',
							// the "sell" action stands out as a filled button
							tab.primary && 'w-10 rounded-[10px] bg-primary text-[22px] text-white shadow-[0_4px_12px_rgba(1,93,234,0.32)]',
						)}
					>
						{tab.icon}
					</span>
					<span className={cx('max-w-full overflow-hidden text-[11px] leading-tight text-ellipsis whitespace-nowrap', tab.active && 'font-semibold')}>
						{tab.label}
					</span>
				</Link>
			))}
		</nav>
	);
};

export default MobileTabBar;
