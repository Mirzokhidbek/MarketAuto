import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useReactiveVar } from '@apollo/client/react';
import Dropdown from '../ui/Dropdown';
import { CountBadge, Spinner } from '../ui/Feedback';
import { cx } from '../ui/classNames';
import { notificationPingVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { sweetErrorHandling } from '../../sweetAlert';
import NotificationItem from '../notifications/NotificationItem';
import { groupByDate, notificationHref } from '../notifications/notificationMeta';
import { useNotifications } from '../notifications/useNotifications';
import { BellIcon as NotificationsOutlinedIcon, BellIcon as NotificationsNoneRoundedIcon, DoneAllIcon as DoneAllRoundedIcon } from '../ui/icons';
import { emptyState } from '../ui/styles';

/** header bell: the latest notifications, newest first, split by day; the full list lives on My Page */
const NotificationBell = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [ring, setRing] = useState(false);
	const ping = useReactiveVar(notificationPingVar);
	const firstPing = useRef(ping);
	const { list, loading, unreadCount, markRead, remove } = useNotifications({ limit: 8, unreadOnly });

	// a new notification arrived over the socket: ring the bell once
	useEffect(() => {
		if (ping === firstPing.current) return;
		setRing(true);
		const timer = setTimeout(() => setRing(false), 1200);
		return () => clearTimeout(timer);
	}, [ping]);

	const run = (action: () => Promise<unknown>) => action().catch((err) => sweetErrorHandling(err));

	const openItem = async (item: T, close: () => void) => {
		close();
		if (item.notificationStatus === 'WAIT') run(() => markRead([item._id]));
		await router.push(notificationHref(item));
	};

	return (
		<Dropdown
			panelClassName={'flex w-[400px] max-w-[calc(100vw-16px)] max-h-[min(600px,100vh-96px)] flex-col rounded-2xl py-0 font-sans shadow-[0_12px_32px_rgba(15,23,42,0.14)]'}
			trigger={({ toggle, open, id }) => (
				<button
					type="button"
					className={cx(
						'inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text hover:bg-surface-alt sm:size-10',
						ring && '[&_svg]:origin-[50%_10%] [&_svg]:animate-bell-ring motion-reduce:[&_svg]:animate-none',
					)}
					onClick={toggle}
					aria-haspopup="menu"
					aria-expanded={open}
					aria-controls={id}
					aria-label={t('Notifications') as string}
					title={t('Notifications') as string}
				>
					<CountBadge count={unreadCount}>
						<NotificationsOutlinedIcon />
					</CountBadge>
				</button>
			)}
		>
			{(close) => (
				<>
					<div className="flex items-center justify-between gap-3 px-[18px] pt-4 pb-2.5">
						<div className="flex min-w-0 items-center gap-2">
							<strong className="text-base font-bold whitespace-nowrap text-ink">{t('Notifications')}</strong>
							{unreadCount > 0 && <span className="rounded-full bg-[#e6efff] px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-dark">{t('{{count}} new', { count: unreadCount })}</span>}
						</div>
						<button
							className="inline-flex cursor-pointer items-center gap-1 rounded-md border-0 bg-transparent px-1.5 py-1 font-sans text-[13px] font-semibold whitespace-nowrap text-primary enabled:hover:bg-[#e6efff] disabled:cursor-default disabled:text-faint [&_svg]:text-[17px] max-[420px]:[&_svg]:text-xl"
							disabled={!unreadCount}
							onClick={() => run(() => markRead())}
							title={t('Mark all as read') as string}
							aria-label={t('Mark all as read') as string}
						>
							<DoneAllRoundedIcon /> <span className="max-[420px]:hidden">{t('Mark all as read')}</span>
						</button>
					</div>
					<div className="flex gap-1.5 border-b border-line px-[18px] pb-2.5" role={'tablist'}>
						{[false, true].map((value) => (
							<button
								key={String(value)}
								role={'tab'}
								aria-selected={unreadOnly === value}
								className={cx(
									'inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 font-sans text-[13px] font-semibold',
									unreadOnly === value ? 'bg-ink text-white' : 'bg-[#f1f3f6] text-muted',
								)}
								onClick={() => setUnreadOnly(value)}
							>
								{value ? t('Unread') : t('All')}
								{value && unreadCount > 0 && <span className="min-w-[18px] rounded-full bg-[#c62828] px-[5px] text-[11px] leading-[18px] text-white">{unreadCount}</span>}
							</button>
						))}
					</div>

					<div className="flex-1 overflow-y-auto overscroll-contain">
						{loading && !list.length ? (
							<div className={emptyState}>
								<Spinner size={22} />
							</div>
						) : list.length ? (
							groupByDate(list).map((group) => (
								<section key={group.title}>
									<h4 className="sticky top-0 z-[1] m-0 bg-white/95 px-[18px] pt-2.5 pb-1.5 text-[11.5px] font-bold tracking-[0.05em] text-faint uppercase backdrop-blur-[4px]">{t(group.title)}</h4>
									{group.items.map((item) => (
										<NotificationItem
											key={item._id}
											item={item}
											onOpen={(target) => openItem(target, close)}
											onMarkRead={(target) => run(() => markRead([target._id]))}
											onRemove={(target) => run(() => remove([target._id]))}
										/>
									))}
								</section>
							))
						) : (
							<div className={emptyState}>
								<NotificationsNoneRoundedIcon />
								<strong>{unreadOnly ? t('You are all caught up') : t('No notifications yet.')}</strong>
								<span>
									{unreadOnly
										? t('New likes, comments and listing updates will appear here.')
										: t('We will let you know about likes, comments, followers and your listings.')}
								</span>
							</div>
						)}
					</div>

					<Link href={'/mypage?category=notifications'} className="block border-t border-line px-[18px] py-3 text-center text-[13.5px] font-semibold text-primary hover:bg-surface" onClick={close}>
						{t('See all notifications')} →
					</Link>
				</>
			)}
		</Dropdown>
	);
};

export default NotificationBell;
