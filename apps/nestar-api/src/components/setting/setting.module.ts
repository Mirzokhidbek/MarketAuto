import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import SettingSchema from '../../schemas/Setting.model';
import { AuthModule } from '../auth/auth.module';
import { SettingResolver } from './setting.resolver';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Setting', schema: SettingSchema }]), AuthModule],
	providers: [SettingResolver],
})
export class SettingModule {}
