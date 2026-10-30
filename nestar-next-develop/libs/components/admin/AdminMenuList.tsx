import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { ChartBar, Car, Flag, User, Article, Question, Megaphone, ChatCircleDots, ListChecks, GearSix, Calculator } from 'phosphor-react';
import { GET_ADMIN_BADGES } from '../../../apollo/admin/query';
import { userVar } from '../../../apollo/store';

interface MenuItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	/** key in the badge counts */
	badge?: 'carsPending' | 'reportsOpen' | 'inquiriesWaiting';
	superOnly?: boolean;
}

const icon = (Icon: any) => <Icon size={20} weight="duotone" />;

/** one click = one page; groups are plain headings, not folders to open */
const SECTIONS: { title: string; items: MenuItem[] }[] = [
	{
		title: 'Overview',
		items: [{ label: 'Dashboard', href: '/_admin', icon: icon(ChartBar) }],
	},
	{
		title: 'Moderation',
		items: [
			{ label: 'Cars', href: '/_admin/properties', icon: icon(Car), badge: 'carsPending' },
			{ label: 'Reports', href: '/_admin/reports', icon: icon(Flag), badge: 'reportsOpen' },
			{ label: 'Members', href: '/_admin/users', icon: icon(User), superOnly: true },
			{ label: 'Articles', href: '/_admin/community', icon: icon(Article) },
		],
	},
	{
		title: 'Support',
		items: [
			{ label: 'Questions from members', href: '/_admin/cs/inquiry', icon: icon(ChatCircleDots), badge: 'inquiriesWaiting' },
			{ label: 'FAQ', href: '/_admin/cs/faq', icon: icon(Question) },
			{ label: 'Announcements', href: '/_admin/cs/notice', icon: icon(Megaphone) },
		],
	},
	{
		title: 'System',
		items: [
			{ label: 'Action log', href: '/_admin/system/logs', icon: icon(ListChecks), superOnly: true },
			{ label: 'Import tariff', href: '/_admin/system/import-tariff', icon: icon(Calculator), superOnly: true },
			{ label: 'Site settings', href: '/_admin/system/settings', icon: icon(GearSix), superOnly: true },
		],
	},
];

/** pages only full (SUPER) admins may open; moderators are sent back to the dashboard */
export const SUPER_ONLY_PATHS = SECTIONS.flatMap((section) => section.items)
	.filter((item) => item.superOnly)
	.map((item) => item.href);

/** true for a super-only page and its sub-pages (e.g. /_admin/users/detail) */
export const isSuperOnlyPath = (pathname: string) =>
	SUPER_ONLY_PATHS.some((href) => pathname === href || pathname.startsWith(`${href}/`));

const AdminMenuList = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	// moderators work with cars, reports, articles and support; members, logs and settings are for full admins
	const isSuper = user.memberAdminRole !== 'MODERATOR';
	// waiting work shown as badges; refreshed every minute
	const { data } = useQuery(GET_ADMIN_BADGES, { fetchPolicy: 'network-only', pollInterval: 60000 });
	const counts = data?.getDashboardStats ?? {};

	const isActive = (href: string) =>
		href === '/_admin' ? router.pathname === '/_admin' : router.pathname === href || router.pathname.startsWith(`${href}/`);

	return (
		<nav className={'ma-admin-nav'} aria-label={t('Admin menu') as string}>
			{SECTIONS.map((section) => {
				const items = section.items.filter((item) => isSuper || !item.superOnly);
				if (!items.length) return null;
				return (
					<div key={section.title} className={'ma-admin-nav__group'}>
						<span className={'ma-admin-nav__title'}>{t(section.title)}</span>
						{items.map((item) => {
							const count: number = item.badge ? counts[item.badge] ?? 0 : 0;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`ma-admin-nav__item ${isActive(item.href) ? 'is-active' : ''}`}
									aria-current={isActive(item.href) ? 'page' : undefined}
								>
									{item.icon}
									<span>{t(item.label)}</span>
									{count > 0 && (
										<b className={'ma-admin-badge'} title={t('Waiting') as string}>
											{count > 99 ? '99+' : count}
										</b>
									)}
								</Link>
							);
						})}
					</div>
				);
			})}
		</nav>
	);
};

export default AdminMenuList;
