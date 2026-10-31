import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import type { Response } from 'express';
import { AppService } from './app.service';

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
		res.status(database ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
			status: database ? 'ok' : 'unavailable',
			database: database ? 'up' : 'down',
			uptime: Math.round(process.uptime()),
		});
	}
}
