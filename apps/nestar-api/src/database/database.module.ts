import { settings } from '../libs/env';
import { Module, Logger } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const logger = new Logger('DatabaseModule');

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => ({
				uri: settings.mongoUri,
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
