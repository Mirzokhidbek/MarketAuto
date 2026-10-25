import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/ru';
import 'moment/locale/uz-latn';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

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
