import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchController } from './nestar-batch.controller';
import MemberSchema from '../../nestar-api/src/schemas/Member.model';
import PropertySchema from '../../nestar-api/src/schemas/Property.model';
import BoardArticleSchema from '../../nestar-api/src/schemas/BoardArticle.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		MongooseModule.forFeature([{ name: 'BoardArticle', schema: BoardArticleSchema }]),
	],
	controllers: [BatchController],
	providers: [BatchService],
})
export class BatchModule {}
