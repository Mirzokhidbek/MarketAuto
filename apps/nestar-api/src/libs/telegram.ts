import { createHmac, timingSafeEqual } from 'crypto';

/** the parts of a Telegram user the API keeps (from a bot update or from Mini App initData) */
export interface TelegramUser {
	id: number;
	first_name?: string;
	last_name?: string;
	username?: string;
	language_code?: string;
}

/** Mini App sign-ins older than this are refused, so a leaked initData string soon stops working */
export const INIT_DATA_MAX_AGE_S = 24 * 60 * 60;

/**
 * Checks window.Telegram.WebApp.initData the way Telegram documents it
 * (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 * secret = HMAC-SHA256(key "WebAppData", bot token); hash = HMAC-SHA256(secret, sorted "key=value" lines).
 * Returns the signed-in user, or null when the signature, age or user is not valid.
 */
export const verifyInitData = (
	initData: string,
	botToken: string,
	now = Date.now(),
	maxAgeS = INIT_DATA_MAX_AGE_S,
): TelegramUser | null => {
	const params = new URLSearchParams(initData);
	const hash = params.get('hash');
	if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
	params.delete('hash');
	const checkString = [...params.entries()]
		.map(([key, value]) => `${key}=${value}`)
		.sort()
		.join('\n');
	const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
	const expected = createHmac('sha256', secret).update(checkString).digest();
	if (!timingSafeEqual(expected, Buffer.from(hash, 'hex'))) return null;

	const authDate = Number(params.get('auth_date'));
	if (!authDate || now / 1000 - authDate > maxAgeS) return null;
	try {
		const user = JSON.parse(params.get('user') ?? '') as TelegramUser;
		return Number.isSafeInteger(user?.id) && user.id > 0 ? user : null;
	} catch {
		return null;
	}
};

/** "Ali Valiyev" from first + last name, at most 60 characters */
export const telegramFullName = (user: TelegramUser): string | undefined =>
	[user.first_name, user.last_name].filter(Boolean).join(' ').trim().slice(0, 60) || undefined;
