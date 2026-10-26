/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	env: {
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_API_WS: process.env.REACT_APP_API_WS,
	},
	// short address for the admin panel: /admin -> /_admin (also /ru/admin, /en/admin)
	async redirects() {
		return [
			{ source: '/admin', destination: '/_admin', permanent: false },
			{ source: '/admin/:path*', destination: '/_admin/:path*', permanent: false },
		];
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
