import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { closeRedis } from './libs/redis';

@Injectable()
export class AppService implements OnApplicationShutdown {
	public async onApplicationShutdown(): Promise<void> {
		await closeRedis();
	}

	getHello(): string {
		return 'Welcome to CarPort API Server!';
	}
}
