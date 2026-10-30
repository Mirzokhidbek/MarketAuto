import { imageUrl } from '../../utils';
import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Badge, Menu, MenuItem, Popover } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuList, { isSuperOnlyPath } from '../admin/AdminMenuList';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { userVar } from '../../../apollo/store';
import { GET_ADMIN_BADGES } from '../../../apollo/admin/query';
import { MemberType } from '../../enums/member.enum';

/** quick tabs in the top bar: the pages used every day */
const QUICK = [
	{ label: 'Dashboard', href: '/_admin' },
	{ label: 'Cars', href: '/_admin/properties' },
	{ label: 'Reports', href: '/_admin/reports' },
	{ label: 'Questions', href: '/_admin/cs/inquiry' },
];

/** a reminder in the side card that fits the open page; pages without one show no card */
const TIPS: { path: string; tips: string[] }[] = [
	{
		path: '/_admin/properties',
		tips: [
			'Select several cars with the checkboxes to approve or reject them at once.',
			'When you reject a car, write the reason: the seller can fix it and send it again.',
		],
	},
	{ path: '/_admin/users', tips: ['Open a member to see all their cars, reports and chats in one place.'] },
	{ path: '/_admin/system/logs', tips: ['Every admin action is written to the action log.'] },
	{
		path: '/_admin',
		tips: [
			'When you reject a car, write the reason: the seller can fix it and send it again.',
			'Every admin action is written to the action log.',
		],
	},
];

const tipFor = (pathname: string): string | null => {
	const page = TIPS.find((item) => (item.path === '/_admin' ? pathname === '/_admin' : pathname.startsWith(item.path)));
	return page ? page.tips[new Date().getDate() % page.tips.length] : null;
};

const withAdminLayout = (Component: ComponentType) => {
	return (props: object) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const { t } = useTranslation('common');
		const [loading, setLoading] = useState(true);
		const [sideOpen, setSideOpen] = useState(false);
		const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
		const [bellAnchor, setBellAnchor] = useState<HTMLElement | null>(null);
		const [search, setSearch] = useState('');
		const [searchOpen, setSearchOpen] = useState(false);
		const isSuper = user.memberAdminRole !== 'MODERATOR';
		const isAdmin = user?.memberType === MemberType.ADMIN;

		const { data: badgeData } = useQuery(GET_ADMIN_BADGES, { fetchPolicy: 'cache-and-network', pollInterval: 60000, skip: !isAdmin });
		const counts = badgeData?.getDashboardStats ?? {};
		const waiting = [
			{ label: 'Cars to review', count: counts.carsPending ?? 0, href: '/_admin/properties?status=PENDING' },
			{ label: 'Open reports', count: counts.reportsOpen ?? 0, href: '/_admin/reports' },
			{ label: 'Questions from members', count: counts.inquiriesWaiting ?? 0, href: '/_admin/cs/inquiry' },
		];
		const waitingTotal = waiting.reduce((sum, item) => sum + item.count, 0);
		const tip = tipFor(router.pathname);
		// a moderator who opens a members / settings / log address directly is sent back to the dashboard
		const forbidden = isAdmin && !isSuper && isSuperOnlyPath(router.pathname);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setLoading(false);
		}, []);

		useEffect(() => {
			if (loading || user.memberType === MemberType.ADMIN) return;
			// not logged in: log in first and come back here; logged in but not an admin: home page
			if (!getJwtToken()) router.replace(`/account/join?referrer=${encodeURIComponent(router.asPath)}`).then();
			else router.replace('/').then();
		}, [loading, user, router]);

		useEffect(() => {
			if (forbidden) router.replace('/_admin').then();
		}, [forbidden, router]);

		useEffect(() => {
			setSideOpen(false);
			setSearchOpen(false);
		}, [router.asPath]);

		/** HANDLERS **/
		// the same text can be a car title or a member nick/phone: the admin picks where to look
		const searchIn = (target: 'cars' | 'members') => {
			const q = search.trim();
			if (!q) return;
			router.push({ pathname: target === 'cars' ? '/_admin/properties' : '/_admin/users', query: { q } }).then();
			setSearch('');
		};

		const isQuickActive = (href: string) => (href === '/_admin' ? router.pathname === '/_admin' : router.pathname.startsWith(href));

		if (!user || !isAdmin || forbidden) return null;

		return (
			<main id="pc-wrap" className={'admin ma-adm'}>
				<Head>
					<title>{`${t('Admin panel')} | MarketAuto`}</title>
					<meta name="robots" content="noindex" />
				</Head>

				<aside className={`ma-adm__side ${sideOpen ? 'is-open' : ''}`}>
					<Link href={'/_admin'} className={'ma-adm__logo'}>
						<img src={'/img/logo/logoDark.svg'} alt={'MarketAuto'} />
					</Link>
					<MenuList />
					{tip && (
						<div className={'ma-adm__tip'}>
							<LightbulbOutlinedIcon />
							<p>{t(tip)}</p>
						</div>
					)}
				</aside>
				{sideOpen && <div className={'ma-adm__overlay'} onClick={() => setSideOpen(false)} />}

				<div className={'ma-adm__main'}>
					<header className={'ma-adm__top'}>
						<button className={'ma-adm__icon ma-adm__burger'} onClick={() => setSideOpen(true)} aria-label={t('Menu') as string}>
							<MenuIcon />
						</button>

						<nav className={'ma-adm__quick'} aria-label={t('Quick navigation') as string}>
							{QUICK.map((item) => (
								<Link key={item.href} href={item.href} className={isQuickActive(item.href) ? 'is-active' : ''}>
									{t(item.label)}
								</Link>
							))}
						</nav>

						<div className={'ma-adm__search'}>
							<SearchIcon />
							<input
								value={search}
								placeholder={t('Search cars or members...') as string}
								onChange={(e) => {
									setSearch(e.target.value);
									setSearchOpen(true);
								}}
								onFocus={() => setSearchOpen(true)}
								onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') searchIn('cars');
									if (e.key === 'Escape') setSearchOpen(false);
								}}
								aria-label={t('Search') as string}
							/>
							{searchOpen && search.trim() && (
								<div className={'ma-adm__search-pop'} role={'listbox'}>
									<button onMouseDown={() => searchIn('cars')}>
										{t('Cars')}: <b>{search.trim()}</b>
									</button>
									{isSuper && (
										<button onMouseDown={() => searchIn('members')}>
											{t('Members')}: <b>{search.trim()}</b>
										</button>
									)}
								</div>
							)}
						</div>

						<button
							className={'ma-adm__icon'}
							onClick={(e) => setBellAnchor(e.currentTarget)}
							aria-label={t('Waiting work') as string}
							title={t('Waiting work') as string}
						>
							{/* how many things wait, not just a dot */}
							<Badge color="error" badgeContent={waitingTotal} max={99} invisible={!waitingTotal}>
								<NotificationsNoneRoundedIcon />
							</Badge>
						</button>
						<Popover
							open={!!bellAnchor}
							anchorEl={bellAnchor}
							onClose={() => setBellAnchor(null)}
							anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
							transformOrigin={{ vertical: 'top', horizontal: 'right' }}
							PaperProps={{ className: 'ma-adm__pop' }}
						>
							<strong className={'ma-adm__pop-title'}>{t('Waiting work')}</strong>
							{waiting.map((item) => (
								<Link key={item.href} href={item.href} className={'ma-adm__pop-row'} onClick={() => setBellAnchor(null)}>
									<span>{t(item.label)}</span>
									<b className={item.count ? 'is-hot' : ''}>{item.count}</b>
								</Link>
							))}
						</Popover>

						<select
							className={'ma-adm__lang'}
							value={router.locale}
							aria-label={t('Language') as string}
							onChange={(e) => {
								localStorage.setItem('locale', e.target.value);
								router.push(router.asPath, router.asPath, { locale: e.target.value });
							}}
						>
							<option value={'uz'}>UZ</option>
							<option value={'ru'}>RU</option>
							<option value={'en'}>EN</option>
						</select>

						<button className={'ma-adm__me'} onClick={(e) => setUserMenu(e.currentTarget)} aria-label={t('Account') as string}>
							<img src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'} alt={''} />
							<span>
								<strong>{user.memberNick}</strong>
								<small>{t(isSuper ? 'role_SUPER' : 'role_MODERATOR')}</small>
							</span>
						</button>
						<Menu
							anchorEl={userMenu}
							open={!!userMenu}
							onClose={() => setUserMenu(null)}
							anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
							transformOrigin={{ vertical: 'top', horizontal: 'right' }}
						>
							<MenuItem onClick={() => router.push('/')}>← {t('Back to site')}</MenuItem>
							<MenuItem
								onClick={() => {
									logOut();
									router.push('/').then();
								}}
							>
								{t('Logout')}
							</MenuItem>
						</Menu>
					</header>

					<div id="bunker">
						{/*@ts-ignore*/}
						<Component {...props} />
					</div>
				</div>
			</main>
		);
	};
};

export default withAdminLayout;
