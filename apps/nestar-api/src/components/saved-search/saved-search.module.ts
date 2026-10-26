import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import SavedSearchSchema from '../../schemas/SavedSearch.model';
import { AuthModule } from '../auth/auth.module';
import { SavedSearchResolver } from './saved-search.resolver';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'SavedSearch', schema: SavedSearchSchema }]), AuthModule],
	providers: [SavedSearchResolver],
})
export class SavedSearchModule {}
