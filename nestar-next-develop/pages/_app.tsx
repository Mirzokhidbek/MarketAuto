import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
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
import '../scss/app.scss';
import '../scss/pc/main.scss';

const App = ({ Component, pageProps }: AppProps) => {
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);
	// dates ("2 hours ago", month names) follow the site language; set before children render
	const { locale } = useRouter();
	moment.locale(locale === 'uz' ? 'uz-latn' : locale === 'ru' ? 'ru' : 'en');

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
