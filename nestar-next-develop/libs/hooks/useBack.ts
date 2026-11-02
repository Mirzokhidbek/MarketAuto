import { useEffect } from 'react';
import Router from 'next/router';

// history entries this visit added on top of the first page: "back" leaves the site only when there is none
let depth = 0;

/** back to the previous page of the site, or to the home page when the visit started on this page */
export const goBack = (): void => {
	if (depth > 0) Router.back();
	else void Router.push('/');
};

/** the home page needs no back button */
export const isRootPage = (pathname: string): boolean => pathname === '/';

/**
 * Keeps `depth` in step with the browser history; mounted once in _app.
 * Next.js adds an entry with history.pushState (router.push) and none with replaceState (router.replace);
 * popstate is a back step (a forward step is rare on phones and counted the same).
 */
export const useBackHistory = (): void => {
	useEffect(() => {
		const pushState = window.history.pushState;
		window.history.pushState = function (...args: Parameters<History['pushState']>) {
			depth++;
			return pushState.apply(this, args);
		};
		const onPop = () => {
			depth = Math.max(0, depth - 1);
		};
		window.addEventListener('popstate', onPop);
		return () => {
			window.history.pushState = pushState;
			window.removeEventListener('popstate', onPop);
		};
	}, []);
};
