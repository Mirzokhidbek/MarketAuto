import { imageUrl } from '../../utils';
import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import Dropdown, { DropdownItem } from '../ui/Dropdown';
import { CountBadge } from '../ui/Feedback';
import { cx } from '../ui/classNames';
import MenuList, { isSuperOnlyPath } from '../admin/AdminMenuList';
import AdminWaitingPanel from '../admin/AdminWaitingPanel';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { userVar } from '../../../apollo/store';
import { GET_ADMIN_BADGES } from '../../../apollo/admin/query';
import { MemberType } from '../../enums/member.enum';
import { isInsideTelegram, telegramSignIn } from '../../hooks/useTelegramMiniApp';
import { MenuIcon, SearchIcon, BellIcon as NotificationsNoneRoundedIcon, LightbulbIcon as LightbulbOutlinedIcon } from '../ui/icons';

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

const raised = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)]';
const roundIcon = cx(
	'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[#475569] hover:text-[#0f172a]',
	raised,
);
const searchOption =
	'cursor-pointer overflow-hidden rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left font-sans text-sm text-ellipsis whitespace-nowrap text-[#475569] hover:bg-[#f3f5fa]';

const tipFor = (pathname: string): string | null => {
	const page = TIPS.find((item) => (item.path === '/_admin' ? pathname === '/_admin' : pathname.startsWith(item.path)));
	return page ? page.tips[new Date().getDate() % page.tips.length] : null;
};

const withAdminLayout = (Component: ComponentType<any>) => {
	const AdminLayout = (props: object) => {
		const router = useRouter();
		const user = useReactiveVar(userVar);
		const { t } = useTranslation('common');
		const [loading, setLoading] = useState(true);
		const [sideOpen, setSideOpen] = useState(false);
		const [search, setSearch] = useState('');
		const [searchOpen, setSearchOpen] = useState(false);
		const isSuper = user.memberAdminRole !== 'MODERATOR';
		const isAdmin = user?.memberType === MemberType.ADMIN;

		const { data: badgeData } = useQuery<any>(GET_ADMIN_BADGES, { fetchPolicy: 'cache-and-network', pollInterval: 60000, skip: !isAdmin });
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

		// inside the Telegram Mini App the saved token may predate the admin role: sign in with Telegram once more
		const [telegramChecked, setTelegramChecked] = useState(false);
		useEffect(() => {
			if (loading || user.memberType === MemberType.ADMIN) return;
			if (!telegramChecked && isInsideTelegram()) {
				telegramSignIn(true)
					.then((ok) => {
						const jwt = getJwtToken();
						if (ok && jwt) updateUserInfo(jwt);
					})
					.finally(() => setTelegramChecked(true));
				return;
			}
			// not logged in: log in first and come back here; logged in but not an admin: home page
			if (!getJwtToken()) router.replace(`/account/join?referrer=${encodeURIComponent(router.asPath)}`).then();
			else router.replace('/').then();
		}, [loading, user, router, telegramChecked]);

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
			<main className="min-h-screen bg-[radial-gradient(900px_420px_at_85%_-10%,rgba(120,140,255,0.16),transparent_60%),radial-gradient(700px_380px_at_30%_-20%,rgba(90,200,250,0.1),transparent_60%),#f3f5fa] font-sans text-[#0f172a]">
				<Head>
					<title>{`${t('Admin panel')} | CarPort`}</title>
					<meta name="robots" content="noindex" />
				</Head>

				<aside
					className={cx(
						'fixed inset-y-0 left-0 z-[1200] flex w-[248px] flex-col overflow-y-auto border-r border-[#edf0f6] bg-white/86 px-3.5 pt-[22px] pb-[18px] backdrop-blur-md',
						'max-md:bg-white max-md:shadow-[0_0_40px_rgba(15,23,42,0.2)] max-md:transition-transform max-md:duration-250',
						!sideOpen && 'max-md:-translate-x-full',
					)}
				>
					<Link href={'/_admin'} className="block px-3 pt-1 pb-[18px]">
						<img src={'/img/logo/logo.png'} alt={'CarPort'} className="h-auto w-44" />
					</Link>
					<MenuList />
					{tip && (
						<div className="mt-auto flex flex-col gap-2.5 rounded-[20px] bg-[linear-gradient(160deg,#eef3ff_0%,#f5f0ff_100%)] p-[18px]">
							<LightbulbOutlinedIcon className="text-[#7c5cff]" />
							<p className="m-0 text-[13px] leading-normal text-[#475569]">{t(tip)}</p>
						</div>
					)}
				</aside>
				{sideOpen && <div className="fixed inset-0 z-[1100] bg-ink/35" onClick={() => setSideOpen(false)} />}

				<div className="min-w-0 md:ml-[248px]">
					<header className="sticky top-0 z-[1000] flex flex-wrap items-center gap-2 bg-[#f3f5fa]/82 px-3.5 py-3 backdrop-blur-[10px] md:flex-nowrap md:gap-3 md:px-8 md:py-4">
						<button className={cx(roundIcon, 'md:hidden')} onClick={() => setSideOpen(true)} aria-label={t('Menu') as string}>
							<MenuIcon />
						</button>

						{/* phones and tablets: the side menu is hidden, so the daily pages are one tap away */}
						<nav
							className={cx(
								'order-10 flex w-full gap-1 overflow-x-auto rounded-full bg-white p-[5px] [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_85%,transparent)] md:hidden',
								raised,
							)}
							aria-label={t('Quick navigation') as string}
						>
							{QUICK.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cx(
										'rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
										isQuickActive(item.href) ? 'bg-[#0f172a] text-white' : 'text-[#475569] hover:bg-[#f3f5fa] hover:text-[#0f172a]',
									)}
								>
									{t(item.label)}
								</Link>
							))}
						</nav>

						<div
							className={cx(
								'relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 focus-within:shadow-[0_0_0_3px_rgba(29,78,216,0.15)] md:ml-auto md:w-[200px] md:flex-none xl:w-[260px]',
								raised,
							)}
						>
							<SearchIcon className="shrink-0 text-xl text-faint" />
							<input
								className="min-w-0 flex-1 border-0 bg-transparent font-sans text-sm text-[#0f172a] outline-none placeholder:text-faint"
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
								<div
									className="absolute inset-x-0 top-[calc(100%+8px)] flex flex-col rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
									role={'listbox'}
								>
									<button className={searchOption} onMouseDown={() => searchIn('cars')}>
										{t('Cars')}: <b className="text-[#0f172a]">{search.trim()}</b>
									</button>
									{isSuper && (
										<button className={searchOption} onMouseDown={() => searchIn('members')}>
											{t('Members')}: <b className="text-[#0f172a]">{search.trim()}</b>
										</button>
									)}
								</div>
							)}
						</div>

						<Dropdown
							panelClassName="w-[380px] max-w-[calc(100vw-16px)] max-h-[min(620px,100vh-96px)] overflow-y-auto! rounded-[18px] py-0 shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
							trigger={({ toggle, open, id }) => (
								<button
									className={roundIcon}
									onClick={toggle}
									aria-haspopup="menu"
									aria-expanded={open}
									aria-controls={id}
									aria-label={t('Waiting work') as string}
									title={t('Waiting work') as string}
								>
									{/* how many things wait, not just a dot */}
									<CountBadge count={waitingTotal}>
										<NotificationsNoneRoundedIcon />
									</CountBadge>
								</button>
							)}
						>
							{/* loaded when opened: the oldest cars, reports and questions that wait for a decision */}
							{(close) => <AdminWaitingPanel counts={counts} onNavigate={close} />}
						</Dropdown>

						<select
							className={cx(
								'h-11 cursor-pointer rounded-full border-0 bg-white px-2.5 font-sans text-[13px] font-semibold text-[#475569] max-md:hidden',
								raised,
							)}
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

						<Dropdown
							trigger={({ toggle, open, id }) => (
								<button
									className={cx('flex cursor-pointer items-center gap-2.5 rounded-full border-0 bg-white p-1 text-left xl:pr-3.5', raised)}
									onClick={toggle}
									aria-haspopup="menu"
									aria-expanded={open}
									aria-controls={id}
									aria-label={t('Account') as string}
								>
									<img
										src={user?.memberImage ? imageUrl(user.memberImage) : '/img/profile/defaultUser.svg'}
										alt={''}
										className="size-9 rounded-full object-cover"
									/>
									<span className="hidden flex-col leading-[1.2] xl:flex">
										<strong className="text-[13px] text-[#0f172a]">{user.memberNick}</strong>
										<small className="text-[11px] text-faint">{t(isSuper ? 'role_SUPER' : 'role_MODERATOR')}</small>
									</span>
								</button>
							)}
						>
							{(close) => (
								<>
									<DropdownItem
										onClick={() => {
											close();
											router.push('/');
										}}
									>
										← {t('Back to site')}
									</DropdownItem>
									<DropdownItem
										onClick={() => {
											close();
											logOut();
											router.push('/').then();
										}}
									>
										{t('Logout')}
									</DropdownItem>
								</>
							)}
						</Dropdown>
					</header>

					<div className="px-3.5 pt-1 pb-8 md:px-8 md:pt-2 md:pb-12">
						<Component {...props} />
					</div>
				</div>
			</main>
		);
	};
	AdminLayout.displayName = `withAdminLayout(${Component.displayName ?? Component.name ?? 'Page'})`;
	return AdminLayout;
};

export default withAdminLayout;
