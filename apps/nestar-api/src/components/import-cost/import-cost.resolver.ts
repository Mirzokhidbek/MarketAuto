import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { ImportCost, ImportTariff, ImportTariffInput } from '../../libs/dto/import-cost/import-cost';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { ImportCostService } from './import-cost.service';

@Resolver()
export class ImportCostResolver {
	constructor(private readonly importCostService: ImportCostService) {}

	/** public: the import estimate on the car page */
	@Query(() => ImportCost)
	public async getImportCost(@Args('propertyId') propertyId: string): Promise<ImportCost> {
		return await this.importCostService.getImportCost(shapeIntoMongoObjectId(propertyId));
	}

	/** public too: the car page shows which rates the estimate uses */
	@Query(() => ImportTariff)
	public async getImportTariff(): Promise<ImportTariff> {
		return await this.importCostService.getTariff();
	}

	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Mutation(() => ImportTariff)
	public async updateImportTariff(
		@Args('input') input: ImportTariffInput,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<ImportTariff> {
		return await this.importCostService.updateTariff(adminId, input);
	}
}
