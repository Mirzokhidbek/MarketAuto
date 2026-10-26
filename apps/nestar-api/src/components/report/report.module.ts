import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ReportSchema from '../../schemas/Report.model';
import PropertySchema from '../../schemas/Property.model';
import { AuthModule } from '../auth/auth.module';
import { PropertyModule } from '../property/property.module';
import { ReportService } from './report.service';
import { ReportResolver } from './report.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Report', schema: ReportSchema },
			{ name: 'Property', schema: PropertySchema },
		]),
		AuthModule,
		PropertyModule,
	],
	providers: [ReportService, ReportResolver],
})
export class ReportModule {}
