import { Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { settings } from './env';

const logger = new Logger('Redis');

/** this API process; WebSocket events published by itself are not delivered twice */
export const instanceId = randomUUID();

let client: Redis | undefined;
let lastErrorLog = 0;

const connect = (url: string, name: string, queueWhileOffline = false): Redis => {
	const connection = new Redis(url, {
		connectionName: `carport-${name}`,
		// while Redis is down, calls fail at once and the callers fall back to memory instead of waiting
		enableOfflineQueue: queueWhileOffline,
		maxRetriesPerRequest: queueWhileOffline ? null : 1,
		retryStrategy: (times) => Math.min(times * 500, 10_000),
	});
	connection.on('ready', () => logger.log(`${name} connection ready`));
	connection.on('error', (error: Error) => {
		// one line every 30 s while Redis is unreachable, not one per retry
		if (Date.now() - lastErrorLog < 30_000) return;
		lastErrorLog = Date.now();
		logger.warn(`${name} connection: ${error.message} (working from memory until it is back)`);
	});
	return connection;
};

/**
 * The shared Redis connection, or undefined without REDIS_URL (one API instance, everything in memory).
 * Callers check redisReady() and fall back to memory, so a Redis outage never takes the site down.
 */
export const redis = (): Redis | undefined => {
	const url = settings.redisUrl;
	if (!url) return undefined;
	client ??= connect(url, 'main');
	return client;
};

export const redisReady = (): Redis | undefined => {
	const connection = redis();
	return connection?.status === 'ready' ? connection : undefined;
};

/**
 * A second connection for SUBSCRIBE (a subscribed connection cannot run other commands). Its SUBSCRIBE waits
 * for the connection and is repeated by ioredis after every reconnect.
 */
export const redisSubscriber = (): Redis | undefined => {
	const url = settings.redisUrl;
	return url ? connect(url, 'subscriber', true) : undefined;
};

/** phones, emails and nicks are not written into Redis key names */
export const hashKey = (value: string): string => createHash('sha256').update(value).digest('base64url').slice(0, 22);

export const closeRedis = async (): Promise<void> => {
	if (!client) return;
	const connection = client;
	client = undefined;
	await connection.quit().catch(() => connection.disconnect());
};
