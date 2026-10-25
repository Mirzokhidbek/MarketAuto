import { Html, Head, Main, NextScript } from 'next/document';

// <html lang> is filled in by Next from the active locale; titles and descriptions come from <Seo> per page
export default function Document() {
	return (
		<Html>
			<Head>
				<link rel="icon" type="image/svg+xml" href="/img/logo/favicon.svg" />
				<meta name="theme-color" content="#0B57D0" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
