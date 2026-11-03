// ESLint 10 flat config for the web app (`npm run lint`); the API has its own at the repo root
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'],
	},
	{
		rules: {
			// the code base types GraphQL data loosely on purpose (any / T)
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
