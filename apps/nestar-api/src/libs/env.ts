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
	if (!production && !env.MONGO_DEV) problems.push('MONGO_DEV is not set');
	if (production && !env.CORS_ORIGINS?.split(',').some((origin) => origin.trim()))
		problems.push('CORS_ORIGINS must list the site addresses in production');

	if (problems.length) throw new Error(`Invalid environment:\n - ${problems.join('\n - ')}`);
};

const env = (name: string): string | undefined => process.env[name] || undefined;

/**
 * Every API setting in one typed place (documented in .env.example). Values are read on each access,
 * so the .env file loaded at the top of main.ts is always seen, whatever order modules are imported in.
 */
export const settings = {
	get production(): boolean {
		return process.env.NODE_ENV === 'production';
	},
	get nodeEnv(): string {
		return env('NODE_ENV') ?? 'development';
	},
	get port(): number {
		return Number(env('PORT_API') ?? 3000);
	},
	get mongoUri(): string | undefined {
		return settings.production ? env('MONGO_PROD') : env('MONGO_DEV');
	},
	get secretToken(): string {
		return env('SECRET_TOKEN') ?? '';
	},
	get accessTokenTtl(): string {
		return env('ACCESS_TOKEN_TTL') ?? '1h';
	},
	get refreshTokenDays(): number {
		return Number(env('REFRESH_TOKEN_DAYS') ?? 30);
	},
	get cookieSameSite(): 'lax' | 'strict' | 'none' {
		return (env('COOKIE_SAMESITE') ?? 'lax').toLowerCase() as 'lax' | 'strict' | 'none';
	},
	/** allowed site origins; empty = any origin (development only, assertEnv forbids it in production) */
	get corsOrigins(): string[] {
		return (env('CORS_ORIGINS') ?? '')
			.split(',')
			.map((origin) => origin.trim())
			.filter(Boolean);
	},
	get trustProxy(): boolean {
		return !!env('TRUST_PROXY');
	},
	get sentryDsn(): string | undefined {
		return env('SENTRY_DSN');
	},
	/** admins confirm logins with an SMS code unless ADMIN_2FA=off (local development only) */
	get adminTwoFactor(): boolean {
		return env('ADMIN_2FA') !== 'off';
	},
	get defaultUsdUzs(): number {
		return Number(env('DEFAULT_USD_UZS') ?? 12700);
	},
	get eskiz() {
		return { email: env('ESKIZ_EMAIL'), password: env('ESKIZ_PASSWORD'), from: env('ESKIZ_FROM') ?? '4546' };
	},
	get twilio() {
		return { sid: env('TWILIO_SID'), token: env('TWILIO_TOKEN'), from: env('TWILIO_FROM') };
	},
	get s3() {
		const region = env('S3_REGION') ?? 'us-east-1';
		const bucket = env('S3_BUCKET');
		return {
			bucket,
			region,
			endpoint: env('S3_ENDPOINT'),
			accessKey: env('S3_ACCESS_KEY') ?? '',
			secretKey: env('S3_SECRET_KEY') ?? '',
			publicUrl: env('S3_PUBLIC_URL') ?? `https://${bucket}.s3.${region}.amazonaws.com`,
		};
	},
};
