// replaces Next's built-in PostCSS setup; Tailwind only touches files that import it (styles/tailwind.css)
const config = {
	plugins: {
		'@tailwindcss/postcss': {},
	},
};

export default config;
