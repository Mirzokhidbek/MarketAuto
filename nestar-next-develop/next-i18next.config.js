module.exports = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'uz', 'ru'],
		localeDetection: false,
	},
	trailingSlash: true,
	// keys are natural-language English sentences, so ':' and '.' must not split them
	nsSeparator: false,
	keySeparator: false,
	// pick up edited locale files without restarting `next dev`
	reloadOnPrerender: process.env.NODE_ENV === 'development',
};
