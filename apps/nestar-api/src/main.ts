// .env must be loaded before any module reads process.env (JWT secret, rate limits, ...)
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import { assertEnv, settings } from './libs/env';

// error tracking in production: set SENTRY_DSN (https://sentry.io) — nothing is sent without it
if (settings.sentryDsn) {
	Sentry.init({
		dsn: settings.sentryDsn,
		environment: settings.nodeEnv,
		tracesSampleRate: 0.1,
	});
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppLogger } from './libs/observability/app-logger';
import { redis } from './libs/redis';
import { bindRequestContext, startRequest } from './libs/observability/http-observer';
import * as express from 'express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';

async function bootstrap() {
	assertEnv();
	// connect now, so the first requests already share the Redis rate limits and cache
	redis();
	// body parsers are added below, after the request timer (bodyParser: false keeps Nest from adding them first)
	const app = await NestFactory.create(AppModule, { logger: new AppLogger(), bodyParser: false });
	app.use(startRequest);
	// behind nginx/load balancer: take the client IP from X-Forwarded-For (used by rate limits)
	if (settings.trustProxy) app.getHttpAdapter().getInstance().set('trust proxy', 1);
	app.useGlobalPipes(new ValidationPipe());
	// CORS_ORIGINS="https://marketauto.uz,https://admin.marketauto.uz" (required in production); any origin in development
	const corsOrigins = settings.corsOrigins;
	app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });

	// the API serves JSON and images only: no framing, no MIME sniffing, no referrer leaks, no "X-Powered-By: Express"
	const server = app.getHttpAdapter().getInstance();
	server.disable('x-powered-by');
	app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('Referrer-Policy', 'no-referrer');
		if (settings.production) {
			// JSON and images never run scripts or load anything (the GraphQL IDE, which does, is development only)
			res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
			res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		}
		next();
	});

	// GraphQL bodies are small; photos go through the multipart parser below
	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true, limit: '1mb' }));
	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use(bindRequestContext);
	app.use('/uploads', express.static('uploads'));

	app.useWebSocketAdapter(new WsAdapter(app));
	// SIGTERM from Docker / the orchestrator: finish open requests and close the database cleanly
	app.enableShutdownHooks();
	await app.listen(settings.port);
}
void bootstrap();
