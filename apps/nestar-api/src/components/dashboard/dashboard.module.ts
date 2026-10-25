import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import MemberSchema from '../../schemas/Member.model';
import PropertySchema from '../../schemas/Property.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import NoticeSchema from '../../schemas/Notice.model';
import { AuthModule } from '../auth/auth.module';
import { DashboardResolver } from './dashboard.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Member', schema: MemberSchema },
			{ name: 'Property', schema: PropertySchema },
			{ name: 'BoardArticle', schema: BoardArticleSchema },
			{ name: 'Notice', schema: NoticeSchema },
		]),
		AuthModule,
	],
	providers: [DashboardResolver],
})
export class DashboardModule {}
