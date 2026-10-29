/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// this app has its own lockfile and node_modules; the repo root belongs to the API
	outputFileTracingRoot: __dirname,
	// the only ESLint config Next would find is the API's flat config at the repo root
	eslint: { ignoreDuringBuilds: true },
	// no U+FEFF / @charset in compiled Sass: a BOM in the middle of a merged CSS chunk breaks the minifier
	sassOptions: { charset: false },
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
