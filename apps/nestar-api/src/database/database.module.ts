import { settings } from '../libs/env';
import { Module, Logger } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { watchDatabase } from '../libs/observability/db-monitor';

const logger = new Logger('DatabaseModule');

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => ({
				uri: settings.mongoUri,
				// timing of every query for /metrics and the slow-query log
				monitorCommands: true,
				onConnectionCreate: (connection: Connection) => watchDatabase(connection.getClient()),
			}),
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {
	constructor(@InjectConnection() private readonly connection: Connection) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (connection.readyState === 1) {
			logger.log(`MongoDB is connected into ${settings.production ? 'production' : 'development'}`);
		} else {
			logger.error('DB is not connected!');
		}
	}
}
