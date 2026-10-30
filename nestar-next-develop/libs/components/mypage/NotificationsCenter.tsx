import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Switch } from '@mui/material';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import UnderlineTabs from '../ui/UnderlineTabs';
import EmptyState from '../ui/EmptyState';
import NotificationItem from '../notifications/NotificationItem';
import { groupByDate, notificationHref, NOTIFICATION_TABS } from '../notifications/notificationMeta';
import { useNotifications } from '../notifications/useNotifications';
import { NotificationCategory } from '../../enums/notification.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { T } from '../../types/common';

type Tab = NotificationCategory | 'ALL';
const PAGE = 20;

/** My Page → Notifications: every notification by tab, unread filter, bulk actions and paging */
const NotificationsCenter = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [tab, setTab] = useState<Tab>('ALL');
	const [unreadOnly, setUnreadOnly] = useState(false);
	const { list, total, loading, unreadCount, unreadByCategory, hasMore, loadMore, markRead, remove, clearRead } =
		useNotifications({ limit: PAGE, category: tab, unreadOnly });

	const run = (action: () => Promise<unknown>) => action().catch((err) => sweetErrorHandling(err));
	const openItem = async (item: T) => {
		if (item.notificationStatus === 'WAIT') run(() => markRead([item._id]));
		await router.push(notificationHref(item));
	};
	const clearReadHandler = async () => {
		if (await sweetConfirmAlert(t('Delete all read notifications?') as string)) run(clearRead);
	};

	return (
		<div className={'ma-account-panel ma-noti-center'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Notifications')}</h1>
					<p>
						{unreadCount
							? t('You have {{count}} unread notifications.', { count: unreadCount })
							: t('You are all caught up')}
					</p>
				</div>
				<div className={'ma-noti-center__actions'}>
					<button className={'ma-btn ma-btn--outline'} disabled={!unreadCount} onClick={() => run(() => markRead())}>
						<DoneAllRoundedIcon /> {t('Mark all as read')}
					</button>
					<button className={'ma-btn ma-btn--outline'} onClick={clearReadHandler}>
						<DeleteSweepOutlinedIcon /> {t('Clear read')}
					</button>
				</div>
			</div>

			<div className={'ma-noti-center__bar'}>
				<UnderlineTabs<Tab>
					className={'mb-0'}
					value={tab}
					onChange={setTab}
					items={NOTIFICATION_TABS.map((item) => ({
						value: item.key,
						label: (
							<span className={'ma-noti-center__tab'}>
								{t(item.label)}
								{unreadByCategory[item.counter] > 0 && <span>{unreadByCategory[item.counter]}</span>}
							</span>
						),
					}))}
				/>
				<label className={'ma-noti-center__toggle'}>
					<Switch size="small" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
					{t('Unread only')}
				</label>
			</div>

			{loading && !list.length ? (
				<EmptyState text={''} loading />
			) : list.length ? (
				<>
					{groupByDate(list).map((group) => (
						<section key={group.title} className={'ma-noti-center__group'}>
							<h2>{t(group.title)}</h2>
							<div className={'ma-noti-center__list'}>
								{group.items.map((item) => (
									<NotificationItem
										key={item._id}
										item={item}
										wide
										onOpen={openItem}
										onMarkRead={(target) => run(() => markRead([target._id]))}
										onRemove={(target) => run(() => remove([target._id]))}
									/>
								))}
							</div>
						</section>
					))}
					<div className={'ma-noti-center__more'}>
						<span>{t('Showing {{shown}} of {{total}}', { shown: list.length, total })}</span>
						{hasMore && (
							<button className={'ma-btn ma-btn--outline'} disabled={loading} onClick={() => run(loadMore)}>
								{t('Load more')}
							</button>
						)}
					</div>
				</>
			) : (
				<div className={'ma-noti-center__empty'}>
					<NotificationsNoneRoundedIcon />
					<strong>{unreadOnly ? t('You are all caught up') : t('No notifications yet.')}</strong>
					<span>{t('We will let you know about likes, comments, followers and your listings.')}</span>
				</div>
			)}
		</div>
	);
};

export default NotificationsCenter;
