import { makeVar } from '@apollo/client';

import { CustomJwtPayload } from '../libs/types/customJwtPayload';
export const themeVar = makeVar({});

export const userVar = makeVar<CustomJwtPayload>({
	_id: '',
	memberType: '',
	memberStatus: '',
	memberAuthType: '',
	memberPhone: '',
	memberNick: '',
	memberFullName: '',
	memberImage: '',
	memberAddress: '',
	memberDesc: '',
	memberProperties: 0,
	memberRank: 0,
	memberArticles: 0,
	memberLikes: 0,
	memberViews: 0,
	memberPhoneVerified: false,
	memberTrusted: false,
	memberAdminRole: '',
});

// @ts-ignore
export const socketVar = makeVar<WebSocket>();

/** price display currency (prices are stored in USD) and the official USD -> UZS rate */
export type Currency = 'USD' | 'UZS';
export const currencyVar = makeVar<Currency>('USD');
export const usdRateVar = makeVar<number>(12700);

/** ids of cars picked for side-by-side comparison (max 3, kept in localStorage) */
export const compareVar = makeVar<string[]>([]);

/** private messages: unread total for the header badge and the last message pushed by the socket */
export const unreadMessagesVar = makeVar<number>(0);
export const incomingMessageVar = makeVar<any>(null);

/** notifications: unread total for the bell / My Page badge, and a counter the socket bumps on each new one */
export const unreadNotificationsVar = makeVar<number>(0);
export const notificationPingVar = makeVar<number>(0);
