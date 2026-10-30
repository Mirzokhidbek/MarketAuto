import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	FOLLOW = 'FOLLOW',
	LISTING_APPROVED = 'LISTING_APPROVED',
	LISTING_REJECTED = 'LISTING_REJECTED',
	NEW_LISTING = 'NEW_LISTING', // a new car matches a saved search
	PRICE_DROP = 'PRICE_DROP', // a liked car became cheaper
}
registerEnumType(NotificationType, {
	name: 'NotificationType',
});

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}
registerEnumType(NotificationStatus, {
	name: 'NotificationStatus',
});

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PROPERTY = 'PROPERTY',
}
registerEnumType(NotificationGroup, {
	name: 'NotificationGroup',
});

/** inbox tabs: which notification types each one shows */
export enum NotificationCategory {
	ACTIVITY = 'ACTIVITY', // likes, comments, reviews, new followers
	LISTINGS = 'LISTINGS', // moderation of the member's own cars
	ALERTS = 'ALERTS', // saved-search matches and price drops
}
registerEnumType(NotificationCategory, {
	name: 'NotificationCategory',
});

export const NOTIFICATION_CATEGORY_TYPES: Record<NotificationCategory, NotificationType[]> = {
	[NotificationCategory.ACTIVITY]: [NotificationType.LIKE, NotificationType.COMMENT, NotificationType.FOLLOW],
	[NotificationCategory.LISTINGS]: [NotificationType.LISTING_APPROVED, NotificationType.LISTING_REJECTED],
	[NotificationCategory.ALERTS]: [NotificationType.NEW_LISTING, NotificationType.PRICE_DROP],
};
