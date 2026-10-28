const PLACEHOLDER_SECRET = 'change-me-to-a-long-random-string';

/**
 * Stops the server at startup instead of running with an unsafe setup
 * (e.g. JWTs signed with the string "undefined", or credentialed CORS open to every site).
 */
export const assertEnv = (env: NodeJS.ProcessEnv = process.env): void => {
	const production = env.NODE_ENV === 'production';
	const problems: string[] = [];

	if (!env.SECRET_TOKEN) problems.push('SECRET_TOKEN is not set');
	else if (production && (env.SECRET_TOKEN === PLACEHOLDER_SECRET || env.SECRET_TOKEN.length < 32))
		problems.push('SECRET_TOKEN must be a random string of at least 32 characters in production');

	if (production && !env.MONGO_PROD) problems.push('MONGO_PROD is not set');
	if (production && !env.CORS_ORIGINS?.split(',').some((origin) => origin.trim()))
		problems.push('CORS_ORIGINS must list the site addresses in production');

	if (problems.length) throw new Error(`Invalid environment:\n - ${problems.join('\n - ')}`);
};
