import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useReactiveVar } from '@apollo/client/react';
import { imageUrl, joinHref } from '../../utils';
import { getJwtToken, logOut, updateUserInfo } from '../../auth/index';
import NotificationBell from '../common/NotificationBell';
import { CurrencySwitch, MessagesLink, useGlobalSync } from '../common/HeaderExtras';
import { userVar } from '../../../apollo/store';
import { appBarVar, defaultPageTitle } from '../../hooks/useAppBar';
import { goBack, isRootPage } from '../../hooks/useBack';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { buttonClasses } from '../ui/Button';
import { cx } from '../ui/classNames';
import { AccountCircleIcon, MenuIcon, CloseIcon, ArrowBackIcon, LogoutIcon, ChevronDownIcon } from '../ui/icons';

const LANGUAGES = [
	{ code: 'uz', label: 'Uzbek' },
	{ code: 'ru', label: 'Russian' },
	{ code: 'en', label: 'English' },
];

const iconButton =
	'inline-flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text hover:bg-surface-alt';

const Header = () => {
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const appBar = useReactiveVar(appBarVar);
	const category = typeof router.query.category === 'string' ? router.query.category : undefined;
	const appBarTitle = appBar.title ?? t(defaultPageTitle(router.pathname, category));
	// the flag always matches the language of the page being shown
	const lang = router.locale ?? 'uz';
	const inner = !isRootPage(router.pathname);
	const sellHref = user?._id ? '/mypage?category=addProperty' : joinHref('/mypage?category=addProperty');
	useGlobalSync();

	/** LIFECYCLES **/
	// reopen the site in the language the visitor chose last time
	useEffect(() => {
		const saved = localStorage.getItem('locale');
		if (saved && saved !== router.locale && router.locale === router.defaultLocale && router.locales?.includes(saved)) {
			router.replace(router.asPath, router.asPath, { locale: saved }).then();
		}
		// once, on the first page of the visit
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	// the burger menu closes when a page opens
	useEffect(() => {
		const close = () => setMenuOpen(false);
		router.events.on('routeChangeStart', close);
		return () => router.events.off('routeChangeStart', close);
	}, [router.events]);

	/** HANDLERS **/
	const chooseLanguage = useCallback(
		async (locale: string) => {
			localStorage.setItem('locale', locale);
			await router.push(router.asPath, router.asPath, { locale });
		},
		[router],
	);

	// the section the visitor is in is highlighted in the menu
	const isActive = (path: string) => (path === '/' ? router.pathname === '/' : router.pathname.startsWith(path));
	const links = [
		{ href: '/', path: '/', label: 'Home' },
		{ href: '/property', path: '/property', label: 'Cars' },
		{ href: '/agent', path: '/agent', label: 'Sellers' },
		// buying and selling first; articles are secondary
		{ href: '/community?articleCategory=FREE', path: '/community', label: 'Community' },
		{ href: '/cs', path: '/cs', label: 'CS' },
	];

	return (
		<header className="fixed inset-x-0 top-0 z-[1000] h-16 border-b border-line bg-white font-sans">
			{/* phones, inner pages: an app bar "← Title  actions" instead of the logo bar */}
			{inner && (
				<div className="flex h-full items-center gap-1 pr-2 pl-1.5 sm:hidden">
					<button type="button" className={cx(iconButton, 'size-11 rounded-xl text-ink')} aria-label={t('Back') as string} onClick={goBack}>
						<ArrowBackIcon />
					</button>
					<h1 className="m-0 min-w-0 flex-1 overflow-hidden text-[17px] font-semibold text-ellipsis whitespace-nowrap text-ink">
						{appBarTitle}
					</h1>
					{appBar.actions && <div className="flex shrink-0 items-center gap-0.5">{appBar.actions}</div>}
				</div>
			)}

			<div
				className={cx(
					'mx-auto flex h-full w-[1240px] max-w-[calc(100%-32px)] items-center gap-2 sm:max-w-[calc(100%-48px)]',
					inner && 'max-sm:hidden',
				)}
			>
				<Link href={'/'} className="shrink-0">
					<img src="/img/logo/logo.png" alt="CarPort" className="block w-[140px] sm:w-[170px] lg:w-[190px]" />
				</Link>

				{/* larger screens: the main menu in the bar */}
				<nav className="mx-3 hidden items-center gap-4 whitespace-nowrap md:flex lg:mx-8 lg:gap-6">
					{links.map((link) => (
						<Link
							key={link.path}
							href={link.href}
							className={cx(
								'text-[14.5px] font-medium transition-colors hover:text-primary',
								isActive(link.path) ? 'text-primary' : 'text-text',
							)}
						>
							{t(link.label)}
						</Link>
					))}
				</nav>

				<div className="ml-auto flex items-center gap-0.5 sm:gap-2 lg:gap-3">
					<Link href={sellHref} className={buttonClasses({ size: 'sm', className: 'max-sm:hidden' })}>
						{t('Sell a car')}
					</Link>

					{user?._id ? (
						<Dropdown
							trigger={({ toggle, open, id }) => (
								<button
									type="button"
									className="flex cursor-pointer rounded-full border-0 bg-transparent p-0"
									aria-haspopup="menu"
									aria-expanded={open}
									aria-controls={id}
									aria-label={t('My Page') as string}
									onClick={toggle}
								>
									<img
										src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'}
										alt=""
										className="size-8 rounded-full object-cover sm:size-[38px]"
									/>
								</button>
							)}
						>
							{(close) => (
								<>
									<DropdownItem onClick={() => (close(), router.push(`/member?memberId=${user._id}`))}>
										{t('My public profile')}
									</DropdownItem>
									<DropdownItem onClick={() => (close(), router.push('/mypage'))}>{t('My Page')}</DropdownItem>
									{user.memberType === 'ADMIN' && (
										<DropdownItem onClick={() => (close(), router.push('/_admin'))}>{t('Admin panel')}</DropdownItem>
									)}
									<DropdownItem className="text-primary" onClick={() => logOut()}>
										<LogoutIcon /> {t('Logout')}
									</DropdownItem>
								</>
							)}
						</Dropdown>
					) : (
						<Link
							href={'/account/join'}
							className="flex h-[38px] items-center gap-2 rounded-md border border-line-strong px-2.5 text-sm font-medium text-text hover:border-ink md:px-3.5"
						>
							<AccountCircleIcon />
							<span className="hidden md:inline">
								{t('Login')} / {t('Register')}
							</span>
						</Link>
					)}

					{/* 900–1100px: the bar is full with the menu; the switch returns on wider screens */}
					<CurrencySwitch className="max-sm:hidden md:max-lg:hidden" />
					{user?._id && <MessagesLink />}
					{user?._id && <NotificationBell />}

					<Dropdown
						trigger={({ toggle, open, id }) => (
							<button
								type="button"
								className="flex h-10 cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1 hover:bg-surface-alt sm:px-1.5"
								aria-haspopup="menu"
								aria-expanded={open}
								aria-controls={id}
								aria-label={t('Language') as string}
								onClick={toggle}
							>
								<img src={`/img/flag/lang${lang}.png`} alt={lang} className="h-[17px] w-6 rounded-[2px]" />
								<ChevronDownIcon className="text-faint max-sm:hidden" fontSize="small" />
							</button>
						)}
					>
						{(close) =>
							LANGUAGES.map((item) => (
								<DropdownItem key={item.code} onClick={() => (close(), chooseLanguage(item.code))}>
									<img src={`/img/flag/lang${item.code}.png`} alt="" className="h-[17px] w-6 rounded-[2px]" />
									{t(item.label)}
								</DropdownItem>
							))
						}
					</Dropdown>

					<button
						type="button"
						className="ml-1 inline-flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-line bg-white text-ink sm:size-[42px] md:hidden"
						aria-label={t('Menu') as string}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
					>
						{menuOpen ? <CloseIcon /> : <MenuIcon />}
					</button>
				</div>
			</div>

			{/* phones and tablets: the burger menu, under the bar, over a dimmed page */}
			{menuOpen && (
				<>
					<div className="fixed inset-x-0 top-16 bottom-0 bg-ink/30 md:hidden" onClick={() => setMenuOpen(false)} />
					<nav className="absolute inset-x-2 top-[68px] flex flex-col rounded-[14px] border border-line bg-white p-2 shadow-float md:hidden">
						{links.map((link) => (
							<Link
								key={link.path}
								href={link.href}
								className={cx(
									'rounded-[10px] px-3.5 py-3 text-base font-medium hover:bg-surface',
									isActive(link.path) ? 'bg-primary-soft font-semibold text-primary' : 'text-text',
								)}
							>
								{t(link.label)}
							</Link>
						))}
						{/* phones: actions that do not fit into the header bar */}
						<div className="mt-2 flex items-center gap-3 border-t border-line px-1.5 pt-3 pb-1 sm:hidden">
							<Link href={sellHref} className={buttonClasses({ className: 'flex-1' })}>
								{t('Sell a car')}
							</Link>
							<CurrencySwitch />
						</div>
					</nav>
				</>
			)}
		</header>
	);
};

export default Header;
