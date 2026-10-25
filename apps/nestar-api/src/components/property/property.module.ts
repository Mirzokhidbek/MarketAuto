import { Module } from '@nestjs/common';
import { PropertyResolver } from './property.resolver';
import { PropertyService } from './property.service';
import PropertySchema from '../../schemas/Property.model';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{
				name: 'Property',
				schema: PropertySchema,
			},
		]),
		AuthModule,
		NotificationModule,
		ViewModule,
		MemberModule,
		LikeModule,
	],
	providers: [PropertyResolver, PropertyService],
	exports: [PropertyService],
})
export class PropertyModule {}
