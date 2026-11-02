import { useEffect } from 'react';
import { hasSession, logInWithTelegram } from '../auth';

interface TelegramWebApp {
	initData: string;
	ready: () => void;
	expand: () => void;
}

declare global {
	interface Window {
		Telegram?: { WebApp?: TelegramWebApp };
	}
}

const SCRIPT = 'https://telegram.org/js/telegram-web-app.js';
// Telegram opens a Mini App with #tgWebAppData=... in the address; later pages of the visit keep this mark
const MARK = 'tgMiniApp';

const insideTelegram = (): boolean => {
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

/**
 * The Mini App inside Telegram: full height, and signed in with the Telegram account (no password, no SMS).
 * Telegram's script is loaded only there, so the site opened in a normal browser does not wait for telegram.org.
 */
export const useTelegramMiniApp = (): void => {
	useEffect(() => {
		if (!insideTelegram()) return;
		loadScript()
			.then(async () => {
				const webApp = window.Telegram?.WebApp;
				if (!webApp?.initData) return;
				webApp.ready();
				webApp.expand();
				if (!hasSession()) await logInWithTelegram(webApp.initData);
			})
			.catch((err) => console.warn('Telegram Mini App:', err.message));
	}, []);
};
