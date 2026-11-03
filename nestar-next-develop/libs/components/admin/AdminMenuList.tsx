import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { GET_ADMIN_BADGES } from '../../../apollo/admin/query';
import { userVar } from '../../../apollo/store';
import { ChartIcon as ChartBar, CarIcon as Car, FlagIcon as Flag, PersonIcon as User, ArticleIcon as Article, HelpIcon as Question, MegaphoneIcon as Megaphone, ChatDotsIcon as ChatCircleDots, ListChecksIcon as ListChecks, SettingsIcon as GearSix, CalculatorIcon as Calculator } from '../ui/icons';
import { cx } from '../ui/classNames';

interface MenuItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	/** key in the badge counts */
	badge?: 'carsPending' | 'reportsOpen' | 'inquiriesWaiting';
	superOnly?: boolean;
}

const icon = (Icon: any) => <Icon size={20} />;

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
	const { data } = useQuery<any>(GET_ADMIN_BADGES, { fetchPolicy: 'network-only', pollInterval: 60000 });
	const counts = data?.getDashboardStats ?? {};

	const isActive = (href: string) =>
		href === '/_admin' ? router.pathname === '/_admin' : router.pathname === href || router.pathname.startsWith(`${href}/`);

	return (
		<nav className="flex flex-col gap-4 font-sans" aria-label={t('Admin menu') as string}>
			{SECTIONS.map((section) => {
				const items = section.items.filter((item) => isSuper || !item.superOnly);
				if (!items.length) return null;
				return (
					<div key={section.title} className="flex flex-col gap-0.5">
						<span className="px-3 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">{t(section.title)}</span>
						{items.map((item) => {
							const count: number = item.badge ? counts[item.badge] ?? 0 : 0;
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cx(
										'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1d4ed8] [&>svg]:shrink-0',
										isActive(item.href)
											? 'bg-[#e9f0ff] font-semibold text-[#1d4ed8] [&>svg]:text-[#1d4ed8]'
											: 'font-medium text-[#475569] hover:bg-[#f3f5fa] hover:text-[#0f172a] [&>svg]:text-faint',
									)}
									aria-current={isActive(item.href) ? 'page' : undefined}
								>
									{item.icon}
									<span>{t(item.label)}</span>
									{count > 0 && (
										<b className="ml-auto min-w-[22px] rounded-full bg-[#e5484d] px-[7px] py-0.5 text-center text-[11px] font-bold text-white" title={t('Waiting') as string}>
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
