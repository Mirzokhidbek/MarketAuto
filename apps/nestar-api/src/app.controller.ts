import { Controller, Get, Headers, HttpStatus, Res } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import type { Response } from 'express';
import { AppService } from './app.service';
import { settings } from './libs/env';
import { metricsRegistry } from './libs/observability/metrics';
import { redis } from './libs/redis';

/** constant-time compare: the token cannot be guessed byte by byte from response times */
const sameSecret = (given: string, expected: string): boolean => {
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
};

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		@InjectConnection() private readonly connection: Connection,
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	/**
	 * Liveness/readiness for Docker, the load balancer and uptime monitors: 200 when the database answers,
	 * 503 otherwise (the instance should then get no traffic). No details that help an attacker.
	 */
	@Get('health')
	async health(@Res() res: Response): Promise<void> {
		let database = this.connection.readyState === ConnectionStates.connected;
		if (database) {
			try {
				await this.connection.db?.admin().ping();
			} catch {
				database = false;
			}
		}
		// Redis down is not "unhealthy": limits and cache fall back to memory, so the instance keeps its traffic
		const cache = redis();
		res.status(database ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
			status: database ? 'ok' : 'unavailable',
			database: database ? 'up' : 'down',
			redis: !cache ? 'off' : cache.status === 'ready' ? 'up' : 'down',
			uptime: Math.round(process.uptime()),
		});
	}

	/**
	 * Prometheus metrics (request and query times, errors, rate limits, cache, process). Production needs
	 * METRICS_TOKEN and "Authorization: Bearer <token>"; without the token the endpoint does not exist there.
	 */
	@Get('metrics')
	async metrics(@Headers('authorization') authorization: string | undefined, @Res() res: Response): Promise<void> {
		const token = settings.metricsToken;
		if (settings.production || token) {
			if (!token) {
				res.status(HttpStatus.NOT_FOUND).end();
				return;
			}
			if (!sameSecret(String(authorization ?? ''), `Bearer ${token}`)) {
				res.status(HttpStatus.UNAUTHORIZED).end();
				return;
			}
		}
		res.setHeader('Content-Type', metricsRegistry.contentType);
		res.send(await metricsRegistry.metrics());
	}
}
