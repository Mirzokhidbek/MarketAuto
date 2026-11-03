import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import Head from 'next/head';
import { ApolloProvider } from '@apollo/client/react';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next/pages';
import * as Sentry from '@sentry/browser';

// browser error tracking in production: set NEXT_PUBLIC_SENTRY_DSN; nothing is sent without it
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
	Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
}
import { useRouter } from 'next/router';
import { setDateLocale } from '../libs/date';
import { useTelegramMiniApp } from '../libs/hooks/useTelegramMiniApp';
import { useBackHistory } from '../libs/hooks/useBack';
import '../styles/tailwind.css';

const App = ({ Component, pageProps }: AppProps) => {
	const client = useApollo(pageProps.initialApolloState);
	// dates ("2 hours ago", month names) follow the site language; set before children render
	const { locale } = useRouter();
	setDateLocale(locale);

	useBackHistory();
	useTelegramMiniApp();

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
			<Component {...pageProps} />
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
