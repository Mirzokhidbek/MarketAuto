import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { light } from '../styles/mui-theme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import * as Sentry from '@sentry/browser';

// browser error tracking in production: set NEXT_PUBLIC_SENTRY_DSN; nothing is sent without it
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
	Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
}
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/uz-latn';
// moment's own Uzbek gives "Bir necha 2 kun oldin"; natural wording instead: "2 kun oldin", "hozirgina"
moment.updateLocale('uz-latn', {
	relativeTime: {
		future: '%s dan keyin',
		past: '%s oldin',
		s: 'bir necha soniya',
		ss: '%d soniya',
		m: '1 daqiqa',
		mm: '%d daqiqa',
		h: '1 soat',
		hh: '%d soat',
		d: '1 kun',
		dd: '%d kun',
		M: '1 oy',
		MM: '%d oy',
		y: '1 yil',
		yy: '%d yil',
	},
});
import '../styles/index.scss';
import '../styles/tailwind.css';

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);
	// dates ("2 hours ago", month names) follow the site language; set before children render
	const { locale } = useRouter();
	moment.locale(locale === 'uz' ? 'uz-latn' : locale === 'ru' ? 'ru' : 'en');

	// installable app + offline page; only in production builds (in development it would cache stale code)
	useEffect(() => {
		if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
		navigator.serviceWorker.register('/sw.js').catch(() => undefined);
	}, []);

	return (
		<ApolloProvider client={client}>
			<Head>
				{/* viewport-fit=cover: content may use the full screen; fixed bars add the safe-area insets themselves */}
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
			</Head>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
