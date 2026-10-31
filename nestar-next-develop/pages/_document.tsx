import { Html, Head, Main, NextScript } from 'next/document';

// <html lang> is filled in by Next from the active locale; titles and descriptions come from <Seo> per page
export default function Document() {
	return (
		<Html>
			<Head>
				<link rel="icon" href="/favicon.ico" sizes="any" />
				<link rel="icon" type="image/png" sizes="32x32" href="/img/logo/favicon-32.png" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/site.webmanifest" />
				<meta name="theme-color" content="#015DEA" />
				{/* "Add to Home Screen" opens CarPort full screen like an app */}
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-title" content="CarPort" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="format-detection" content="telephone=no" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
