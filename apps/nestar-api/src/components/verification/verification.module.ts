import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import VerificationSchema from '../../schemas/Verification.model';
import MemberSchema from '../../schemas/Member.model';
import { SmsService } from './sms.service';
import { VerificationService } from './verification.service';
import { VerificationResolver } from './verification.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Verification', schema: VerificationSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
	],
	providers: [SmsService, VerificationService, VerificationResolver],
	exports: [VerificationService],
})
export class VerificationModule {}
