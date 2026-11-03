import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import Switch from '../ui/Switch';
import UnderlineTabs from '../ui/UnderlineTabs';
import EmptyState from '../ui/EmptyState';
import NotificationItem from '../notifications/NotificationItem';
import { groupByDate, notificationHref, NOTIFICATION_TABS } from '../notifications/notificationMeta';
import { useNotifications } from '../notifications/useNotifications';
import { NotificationCategory } from '../../enums/notification.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { T } from '../../types/common';
import { DoneAllIcon as DoneAllRoundedIcon, DeleteSweepIcon as DeleteSweepOutlinedIcon, BellIcon as NotificationsNoneRoundedIcon } from '../ui/icons';
import { accountPanel, accountPanelHead, emptyState } from '../ui/styles';
import { buttonClasses } from '../ui/Button';

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
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Notifications')}</h1>
					<p>
						{unreadCount
							? t('You have {{count}} unread notifications.', { count: unreadCount })
							: t('You are all caught up')}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<button className={buttonClasses({ variant: 'outline', size: 'sm' })} disabled={!unreadCount} onClick={() => run(() => markRead())}>
						<DoneAllRoundedIcon /> {t('Mark all as read')}
					</button>
					<button className={buttonClasses({ variant: 'outline', size: 'sm' })} onClick={clearReadHandler}>
						<DeleteSweepOutlinedIcon /> {t('Clear read')}
					</button>
				</div>
			</div>

			<div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line">
				<UnderlineTabs<Tab>
					className={'mb-0 border-b-0'}
					value={tab}
					onChange={setTab}
					items={NOTIFICATION_TABS.map((item) => ({
						value: item.key,
						label: (
							<span className="inline-flex items-center gap-1.5">
								{t(item.label)}
								{unreadByCategory[item.counter] > 0 && (
									<span className="min-w-5 rounded-full bg-[#c62828] px-1.5 text-center text-[11.5px] leading-5 text-white">
										{unreadByCategory[item.counter]}
									</span>
								)}
							</span>
						),
					}))}
				/>
				<Switch className="text-[13.5px] font-semibold text-muted" checked={unreadOnly} onChange={setUnreadOnly}>
					{t('Unread only')}
				</Switch>
			</div>

			{loading && !list.length ? (
				<EmptyState text={''} loading />
			) : list.length ? (
				<>
					{groupByDate(list).map((group) => (
						<section key={group.title} className="mt-[18px]">
							<h2 className="m-0 mb-2 text-xs font-bold tracking-[0.05em] text-faint uppercase">{t(group.title)}</h2>
							<div className="flex flex-col gap-1">
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
					<div className="mt-5 flex items-center justify-between gap-3 text-[13px] text-faint">
						<span>{t('Showing {{shown}} of {{total}}', { shown: list.length, total })}</span>
						{hasMore && (
							<button className={buttonClasses({ variant: 'outline' })} disabled={loading} onClick={() => run(loadMore)}>
								{t('Load more')}
							</button>
						)}
					</div>
				</>
			) : (
				<div className={`${emptyState} mt-6 rounded-[14px] border border-dashed border-line-strong`}>
					<NotificationsNoneRoundedIcon />
					<strong>{unreadOnly ? t('You are all caught up') : t('No notifications yet.')}</strong>
					<span>{t('We will let you know about likes, comments, followers and your listings.')}</span>
				</div>
			)}
		</div>
	);
};

export default NotificationsCenter;
