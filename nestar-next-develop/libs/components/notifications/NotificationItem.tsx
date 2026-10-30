import React from 'react';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { imageUrl } from '../../utils';
import { T } from '../../types/common';
import { isSystemNotification, NOTIFICATION_MESSAGES, typeLook } from './notificationMeta';

interface NotificationItemProps {
	item: T;
	onOpen: (item: T) => void;
	onMarkRead: (item: T) => void;
	onRemove: (item: T) => void;
	/** bigger row with the full date, for the notification page */
	wide?: boolean;
}

/** one notification: avatar (or the type icon for system messages) with a type badge, text, time and quick actions */
const NotificationItem = ({ item, onOpen, onMarkRead, onRemove, wide }: NotificationItemProps) => {
	const { t } = useTranslation('common');
	const author = item.authorData;
	const name = author?.memberFullName || author?.memberNick || t('Someone');
	const unread = item.notificationStatus === 'WAIT';
	const look = typeLook(item.notificationType);
	const system = isSystemNotification(item);
	const message = t(NOTIFICATION_MESSAGES[`${item.notificationType}_${item.notificationGroup}`] ?? '{{name}}', { name });

	return (
		<div className={`ma-noti ${unread ? 'is-unread' : ''} ${wide ? 'ma-noti--wide' : ''}`}>
			<button className={'ma-noti__main'} onClick={() => onOpen(item)}>
				<span className={`ma-noti__avatar ma-noti--${look.tone} ${system ? 'is-system' : ''}`}>
					{system ? (
						look.icon
					) : (
						<>
							<img src={author?.memberImage ? imageUrl(author.memberImage) : '/img/profile/defaultUser.svg'} alt={''} />
							<span className={'ma-noti__badge'}>{look.icon}</span>
						</>
					)}
				</span>
				<span className={'ma-noti__body'}>
					<span className={'ma-noti__text'}>
						{message}
						{item.notificationGroup !== 'MEMBER' && item.notificationTitle && <strong> “{item.notificationTitle}”</strong>}
					</span>
					{item.notificationType === 'LISTING_REJECTED' && item.notificationDesc && (
						<span className={'ma-noti__reason'}>
							{t('Reason')}: {item.notificationDesc}
						</span>
					)}
					<time className={'ma-noti__time'} dateTime={item.createdAt} title={moment(item.createdAt).format('DD.MM.YYYY HH:mm')}>
						{wide ? `${moment(item.createdAt).fromNow()} · ${moment(item.createdAt).format('DD MMM, HH:mm')}` : moment(item.createdAt).fromNow()}
					</time>
				</span>
				{unread && <span className={'ma-noti__dot'} aria-label={t('Unread') as string} />}
			</button>
			<span className={'ma-noti__actions'}>
				{unread && (
					<button onClick={() => onMarkRead(item)} title={t('Mark as read') as string} aria-label={t('Mark as read') as string}>
						<DoneRoundedIcon />
					</button>
				)}
				<button onClick={() => onRemove(item)} title={t('Delete') as string} aria-label={t('Delete') as string}>
					<CloseRoundedIcon />
				</button>
			</span>
		</div>
	);
};

export default NotificationItem;
