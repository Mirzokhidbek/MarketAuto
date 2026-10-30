import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import PropertySchema from '../../schemas/Property.model';
import SettingSchema from '../../schemas/Setting.model';
import { AuthModule } from '../auth/auth.module';
import { ImportCostResolver } from './import-cost.resolver';
import { ImportCostService } from './import-cost.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Property', schema: PropertySchema },
			{ name: 'Setting', schema: SettingSchema },
		]),
		AuthModule,
	],
	providers: [ImportCostResolver, ImportCostService],
})
export class ImportCostModule {}
