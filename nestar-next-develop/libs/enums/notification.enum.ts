export enum NotificationType {
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	FOLLOW = 'FOLLOW',
	LISTING_APPROVED = 'LISTING_APPROVED',
	LISTING_REJECTED = 'LISTING_REJECTED',
	NEW_LISTING = 'NEW_LISTING',
	PRICE_DROP = 'PRICE_DROP',
}

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	ARTICLE = 'ARTICLE',
	PROPERTY = 'PROPERTY',
}

/** inbox tabs (same values as the API's NotificationCategory) */
export enum NotificationCategory {
	ACTIVITY = 'ACTIVITY',
	LISTINGS = 'LISTINGS',
	ALERTS = 'ALERTS',
}
