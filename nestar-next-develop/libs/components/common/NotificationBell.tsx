import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Badge, CircularProgress, Popover } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import { notificationPingVar } from '../../../apollo/store';
import { T } from '../../types/common';
import { sweetErrorHandling } from '../../sweetAlert';
import NotificationItem from '../notifications/NotificationItem';
import { groupByDate, notificationHref } from '../notifications/notificationMeta';
import { useNotifications } from '../notifications/useNotifications';

/** header bell: the latest notifications, newest first, split by day; the full list lives on My Page */
const NotificationBell = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
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

	const openItem = async (item: T) => {
		setAnchor(null);
		if (item.notificationStatus === 'WAIT') run(() => markRead([item._id]));
		await router.push(notificationHref(item));
	};

	return (
		<>
			<button
				className={`ma-bell ${ring ? 'is-ringing' : ''}`}
				onClick={(e) => setAnchor(e.currentTarget)}
				aria-label={t('Notifications') as string}
				title={t('Notifications') as string}
			>
				<Badge badgeContent={unreadCount} color="error" max={99}>
					<NotificationsOutlinedIcon className={'notification-icon'} />
				</Badge>
			</button>
			<Popover
				open={!!anchor}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{ className: 'ma-bell__panel' }}
			>
				<div className={'ma-bell__head'}>
					<div>
						<strong>{t('Notifications')}</strong>
						{unreadCount > 0 && <span className={'ma-bell__count'}>{t('{{count}} new', { count: unreadCount })}</span>}
					</div>
					<button
						className={'ma-bell__link'}
						disabled={!unreadCount}
						onClick={() => run(() => markRead())}
						title={t('Mark all as read') as string}
						aria-label={t('Mark all as read') as string}
					>
						<DoneAllRoundedIcon /> <span>{t('Mark all as read')}</span>
					</button>
				</div>
				<div className={'ma-bell__tabs'} role={'tablist'}>
					{[false, true].map((value) => (
						<button
							key={String(value)}
							role={'tab'}
							aria-selected={unreadOnly === value}
							className={unreadOnly === value ? 'is-active' : ''}
							onClick={() => setUnreadOnly(value)}
						>
							{value ? t('Unread') : t('All')}
							{value && unreadCount > 0 && <span>{unreadCount}</span>}
						</button>
					))}
				</div>

				<div className={'ma-bell__list'}>
					{loading && !list.length ? (
						<div className={'ma-bell__state'}>
							<CircularProgress size={22} />
						</div>
					) : list.length ? (
						groupByDate(list).map((group) => (
							<section key={group.title}>
								<h4 className={'ma-bell__group'}>{t(group.title)}</h4>
								{group.items.map((item) => (
									<NotificationItem
										key={item._id}
										item={item}
										onOpen={openItem}
										onMarkRead={(target) => run(() => markRead([target._id]))}
										onRemove={(target) => run(() => remove([target._id]))}
									/>
								))}
							</section>
						))
					) : (
						<div className={'ma-bell__state'}>
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

				<Link href={'/mypage?category=notifications'} className={'ma-bell__footer'} onClick={() => setAnchor(null)}>
					{t('See all notifications')} →
				</Link>
			</Popover>
		</>
	);
};

export default NotificationBell;
