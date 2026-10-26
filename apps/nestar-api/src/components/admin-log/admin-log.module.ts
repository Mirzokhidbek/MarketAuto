import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import AdminLogSchema from '../../schemas/AdminLog.model';
import { AuthModule } from '../auth/auth.module';
import { AdminLogService } from './admin-log.service';
import { AdminLogResolver } from './admin-log.resolver';

/** global: every admin action (members, listings, reports, articles...) is written here */
@Global()
@Module({
	imports: [MongooseModule.forFeature([{ name: 'AdminLog', schema: AdminLogSchema }]), AuthModule],
	providers: [AdminLogService, AdminLogResolver],
	exports: [AdminLogService],
})
export class AdminLogModule {}
