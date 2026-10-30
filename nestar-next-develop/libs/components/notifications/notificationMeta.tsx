import React from 'react';
import moment from 'moment';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import { NotificationCategory } from '../../enums/notification.enum';
import { T } from '../../types/common';

/** translation key per notification type + group; {{name}} is the member who triggered it */
export const NOTIFICATION_MESSAGES: Record<string, string> = {
	LIKE_PROPERTY: '{{name}} liked your car',
	LIKE_ARTICLE: '{{name}} liked your article',
	LIKE_MEMBER: '{{name}} liked your profile',
	COMMENT_PROPERTY: '{{name}} commented on your car',
	COMMENT_ARTICLE: '{{name}} commented on your article',
	COMMENT_MEMBER: '{{name}} left a review on your profile',
	FOLLOW_MEMBER: '{{name}} started following you',
	LISTING_APPROVED_PROPERTY: 'Your listing was approved and is now visible',
	LISTING_REJECTED_PROPERTY: 'Your listing was rejected by moderation',
	NEW_LISTING_PROPERTY: 'New car for your saved search',
	PRICE_DROP_PROPERTY: 'Price dropped on a car you saved',
};

/** icon and colour tone of each type: the small badge on the avatar */
const TYPE_LOOK: Record<string, { icon: React.ReactNode; tone: string }> = {
	LIKE: { icon: <FavoriteRoundedIcon />, tone: 'rose' },
	COMMENT: { icon: <ChatBubbleRoundedIcon />, tone: 'blue' },
	FOLLOW: { icon: <PersonAddAlt1RoundedIcon />, tone: 'violet' },
	LISTING_APPROVED: { icon: <CheckCircleRoundedIcon />, tone: 'green' },
	LISTING_REJECTED: { icon: <ErrorRoundedIcon />, tone: 'red' },
	NEW_LISTING: { icon: <DirectionsCarFilledRoundedIcon />, tone: 'blue' },
	PRICE_DROP: { icon: <TrendingDownRoundedIcon />, tone: 'amber' },
};

export const typeLook = (type: string) => TYPE_LOOK[type] ?? { icon: <NotificationsRoundedIcon />, tone: 'blue' };

/** moderation and alerts come from MarketAuto itself, not from a member: shown with the type icon, no avatar */
export const isSystemNotification = (item: T) =>
	['LISTING_APPROVED', 'LISTING_REJECTED', 'NEW_LISTING', 'PRICE_DROP'].includes(item.notificationType);

/** where a click on the notification leads */
export const notificationHref = (item: T): string => {
	// a rejected listing is not public: send the seller to the list where it can be fixed
	if (item.notificationType === 'LISTING_REJECTED') return '/mypage?category=myProperties&status=REJECTED';
	if (item.propertyId) return `/property/detail?id=${item.propertyId}`;
	if (item.articleId) return `/community/detail?id=${item.articleId}`;
	return `/member?memberId=${item.authorId}`;
};

/** inbox tabs: label and the key of its unread counter */
export const NOTIFICATION_TABS: { key: NotificationCategory | 'ALL'; label: string; counter: string }[] = [
	{ key: 'ALL', label: 'All', counter: 'all' },
	{ key: NotificationCategory.ACTIVITY, label: 'Activity', counter: 'activity' },
	{ key: NotificationCategory.LISTINGS, label: 'My listings', counter: 'listings' },
	{ key: NotificationCategory.ALERTS, label: 'Alerts', counter: 'alerts' },
];

/** "Today", "Yesterday", "This week", "Earlier": the list is split by these headings */
export const dateGroup = (date: string | Date): string => {
	const day = moment(date).startOf('day');
	const today = moment().startOf('day');
	const diff = today.diff(day, 'days');
	if (diff <= 0) return 'Today';
	if (diff === 1) return 'Yesterday';
	if (diff < 7) return 'This week';
	return 'Earlier';
};

/** consecutive items with the same date heading, in list order */
export const groupByDate = <I extends T>(items: I[]): { title: string; items: I[] }[] => {
	const groups: { title: string; items: I[] }[] = [];
	for (const item of items) {
		const title = dateGroup(item.createdAt);
		const last = groups[groups.length - 1];
		if (last?.title === title) last.items.push(item);
		else groups.push({ title, items: [item] });
	}
	return groups;
};
