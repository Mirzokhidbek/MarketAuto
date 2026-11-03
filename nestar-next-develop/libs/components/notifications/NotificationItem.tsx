import React from 'react';
import moment from 'moment';
import { useTranslation } from 'next-i18next/pages';
import { imageUrl } from '../../utils';
import { T } from '../../types/common';
import { isSystemNotification, NOTIFICATION_MESSAGES, typeLook } from './notificationMeta';
import { DoneIcon as DoneRoundedIcon, CloseIcon as CloseRoundedIcon } from '../ui/icons';
import { cx } from '../ui/classNames';

const BADGE_TONES: Record<string, string> = {
	rose: 'bg-[#e11d48]',
	blue: 'bg-primary',
	violet: 'bg-[#7c3aed]',
	green: 'bg-[#127a46]',
	red: 'bg-[#c62828]',
	amber: 'bg-[#d97706]',
};

const SYSTEM_TONES: Record<string, string> = {
	rose: 'bg-[#e11d48]/12 text-[#e11d48]',
	blue: 'bg-primary/12 text-primary',
	violet: 'bg-[#7c3aed]/12 text-[#7c3aed]',
	green: 'bg-[#127a46]/12 text-[#127a46]',
	red: 'bg-[#c62828]/12 text-[#c62828]',
	amber: 'bg-[#d97706]/12 text-[#d97706]',
};

const actionButton =
	'flex size-7 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-line-strong hover:text-ink [&_svg]:text-base';

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
		<div
			className={cx(
				'group relative flex items-stretch rounded-xl transition-colors',
				wide ? 'm-0 border' : 'mx-2',
				unread ? 'bg-primary/5 hover:bg-primary/9' : 'hover:bg-surface',
				wide && (unread ? 'border-primary/25' : 'border-line'),
			)}
		>
			<button
				className={cx(
					'flex min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-left font-sans',
					wide ? 'gap-3.5 px-4 py-3.5' : 'gap-3 p-2.5',
				)}
				onClick={() => onOpen(item)}
			>
				<span
					className={cx(
						'relative shrink-0',
						wide ? 'size-12' : 'size-11',
						system && cx('flex items-center justify-center rounded-full [&>svg]:text-[22px]', SYSTEM_TONES[look.tone]),
					)}
				>
					{system ? (
						look.icon
					) : (
						<>
							<img
								src={author?.memberImage ? imageUrl(author.memberImage) : '/img/profile/defaultUser.svg'}
								alt={''}
								className="size-full rounded-full bg-[#f1f3f6] object-cover"
							/>
							<span
								className={cx(
									'absolute -right-[3px] -bottom-[3px] flex size-5 items-center justify-center rounded-full border-2 border-white text-white [&_svg]:text-[11px]',
									BADGE_TONES[look.tone],
								)}
							>
								{look.icon}
							</span>
						</>
					)}
				</span>
				<span className="flex min-w-0 flex-1 flex-col gap-[3px]">
					<span className={cx('leading-[1.45] [&_strong]:font-semibold [&_strong]:text-ink', wide ? 'text-[14.5px]' : 'text-[13.5px]', unread ? 'text-ink' : 'text-text')}>
						{message}
						{item.notificationGroup !== 'MEMBER' && item.notificationTitle && <strong> “{item.notificationTitle}”</strong>}
					</span>
					{item.notificationType === 'LISTING_REJECTED' && item.notificationDesc && (
						<span className="rounded-md bg-[#fdecec] px-2 py-1 text-xs leading-[1.4] text-[#a50e0e]">
							{t('Reason')}: {item.notificationDesc}
						</span>
					)}
					<time className="text-xs text-faint" dateTime={item.createdAt} title={moment(item.createdAt).format('DD.MM.YYYY HH:mm')}>
						{wide ? `${moment(item.createdAt).fromNow()} · ${moment(item.createdAt).format('DD MMM, HH:mm')}` : moment(item.createdAt).fromNow()}
					</time>
				</span>
				{unread && <span className="size-[9px] shrink-0 self-center rounded-full bg-primary" aria-label={t('Unread') as string} />}
			</button>
			{/* shown on hover; always on touch screens */}
			<span
				className={cx(
					'absolute flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:static pointer-coarse:self-center pointer-coarse:pr-2 pointer-coarse:opacity-100',
					wide ? 'top-3 right-3' : 'top-2 right-2',
				)}
			>
				{unread && (
					<button className={actionButton} onClick={() => onMarkRead(item)} title={t('Mark as read') as string} aria-label={t('Mark as read') as string}>
						<DoneRoundedIcon />
					</button>
				)}
				<button className={actionButton} onClick={() => onRemove(item)} title={t('Delete') as string} aria-label={t('Delete') as string}>
					<CloseRoundedIcon />
				</button>
			</span>
		</div>
	);
};

export default NotificationItem;
