import { assertEnv } from './env';

const strongSecret = 'a'.repeat(40);

describe('assertEnv', () => {
	it('requires SECRET_TOKEN everywhere', () => {
		expect(() => assertEnv({ NODE_ENV: 'development' })).toThrow('SECRET_TOKEN is not set');
		expect(() => assertEnv({ NODE_ENV: 'development', SECRET_TOKEN: 'dev' })).not.toThrow();
	});

	it('rejects a weak secret, missing database and open CORS in production', () => {
		const env = { NODE_ENV: 'production', SECRET_TOKEN: 'change-me-to-a-long-random-string', MONGO_PROD: '', CORS_ORIGINS: ' , ' };
		expect(() => assertEnv(env)).toThrow(/32 characters[\s\S]*MONGO_PROD[\s\S]*CORS_ORIGINS/);
	});

	it('accepts a complete production setup', () => {
		const env = { NODE_ENV: 'production', SECRET_TOKEN: strongSecret, MONGO_PROD: 'mongodb://db/x', CORS_ORIGINS: 'https://marketauto.uz' };
		expect(() => assertEnv(env)).not.toThrow();
	});
});
