import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { hasSession, logInWithTelegram } from '../auth';
import { goBack, isRootPage } from './useBack';

interface TelegramWebApp {
	initData: string;
	ready: () => void;
	expand: () => void;
	// newer Telegram clients only; called with ?.()
	disableVerticalSwipes?: () => void;
	setHeaderColor?: (color: string) => void;
	setBackgroundColor?: (color: string) => void;
	BackButton?: { show: () => void; hide: () => void; onClick: (handler: () => void) => void };
}

declare global {
	interface Window {
		Telegram?: { WebApp?: TelegramWebApp };
	}
}

const SCRIPT = 'https://telegram.org/js/telegram-web-app.js';
// Telegram opens a Mini App with #tgWebAppData=... in the address; later pages of the visit keep this mark
const MARK = 'tgMiniApp';

/** the site runs as the Telegram Mini App (opened from the bot), not in a normal browser */
export const isInsideTelegram = (): boolean => {
	if (typeof window === 'undefined') return false;
	if (window.location.hash.includes('tgWebAppData')) sessionStorage.setItem(MARK, '1');
	return sessionStorage.getItem(MARK) === '1';
};

const loadScript = (): Promise<void> =>
	new Promise((resolve, reject) => {
		if (window.Telegram?.WebApp) return resolve();
		const script = document.createElement('script');
		script.src = SCRIPT;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('telegram-web-app.js did not load'));
		document.head.appendChild(script);
	});

let signIn: Promise<boolean> | null = null;

/**
 * Signs the Mini App user in with their Telegram account (the member made by the bot's /start), once per visit.
 * Resolves true when a session exists afterwards. Pages that need a member (e.g. the login page) await it.
 * `fresh`: sign in again even with a session, e.g. when the saved token still shows an older role.
 */
export const telegramSignIn = (fresh = false): Promise<boolean> => {
	if (fresh) signIn = null;
	signIn ??= (async () => {
		if (!isInsideTelegram()) return hasSession();
		await loadScript();
		const webApp = window.Telegram?.WebApp;
		if (!webApp?.initData) return hasSession();
		webApp.ready();
		webApp.expand();
		if (fresh || !hasSession()) await logInWithTelegram(webApp.initData);
		return hasSession();
	})().catch((err) => {
		console.warn('Telegram Mini App:', err.message);
		signIn = null; // a later page may try again
		return false;
	});
	return signIn;
};

/** app-like behaviour inside Telegram; runs once the script is loaded */
const setUpApp = (webApp: TelegramWebApp): void => {
	// scrolling up must not swipe the Mini App closed (a half-filled listing would be lost)
	webApp.disableVerticalSwipes?.();
	webApp.setHeaderColor?.('#ffffff');
	webApp.setBackgroundColor?.('#ffffff');
	webApp.BackButton?.onClick(goBack);
};

/**
 * The Mini App inside Telegram: full height, signed in with the Telegram account (no password, no SMS),
 * Telegram's own back button on every page but home, and no site footer (the bottom tab bar is the menu).
 * Telegram's script is loaded only there, so the site opened in a normal browser does not wait for telegram.org.
 */
export const useTelegramMiniApp = (): void => {
	const { pathname } = useRouter();

	useEffect(() => {
		if (!isInsideTelegram()) return;
		document.documentElement.classList.add('is-telegram');
		void telegramSignIn();
		loadScript()
			.then(() => window.Telegram?.WebApp && setUpApp(window.Telegram.WebApp))
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		if (!isInsideTelegram()) return;
		loadScript()
			.then(() => {
				const back = window.Telegram?.WebApp?.BackButton;
				if (isRootPage(pathname)) back?.hide();
				else back?.show();
			})
			.catch(() => undefined);
	}, [pathname]);
};
