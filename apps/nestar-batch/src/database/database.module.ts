import { Module, Logger } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

const logger = new Logger('DatabaseModule');

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => ({
				uri: process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV,
			}),
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {
	constructor(@InjectConnection() private readonly connection: Connection) {
		if (connection.readyState === ConnectionStates.connected) {
			logger.log(`MongoDB is connected into ${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`);
		} else {
			logger.error('DB is not connected!');
		}
	}
}
