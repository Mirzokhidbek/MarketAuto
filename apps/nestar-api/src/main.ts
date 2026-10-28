// .env must be loaded before any module reads process.env (JWT secret, rate limits, ...)
import 'dotenv/config';
import * as Sentry from '@sentry/node';

// error tracking in production: set SENTRY_DSN (https://sentry.io) — nothing is sent without it
if (process.env.SENTRY_DSN) {
	Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV ?? 'development', tracesSampleRate: 0.1 });
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import * as express from 'express';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { assertEnv } from './libs/env';

async function bootstrap() {
	assertEnv();
	const app = await NestFactory.create(AppModule);
	// behind nginx/load balancer: take the client IP from X-Forwarded-For (used by rate limits)
	if (process.env.TRUST_PROXY) app.getHttpAdapter().getInstance().set('trust proxy', 1);
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalInterceptors(new LoggingInterceptor());
	// CORS_ORIGINS="https://marketauto.uz,https://admin.marketauto.uz" (required in production); any origin in development
	const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
	app.enableCors({ origin: corsOrigins?.length ? corsOrigins : true, credentials: true });

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static('uploads'));

	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
void bootstrap();
