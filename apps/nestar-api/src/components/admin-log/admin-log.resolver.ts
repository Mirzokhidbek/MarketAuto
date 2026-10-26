import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminLogService } from './admin-log.service';
import { AdminLogs, AdminLogsInquiry } from '../../libs/dto/admin-log/admin-log';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver()
export class AdminLogResolver {
	constructor(private readonly adminLogService: AdminLogService) {}

	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Query(() => AdminLogs)
	public async getAdminLogs(@Args('input') input: AdminLogsInquiry): Promise<AdminLogs> {
		return await this.adminLogService.getLogs(input);
	}
}
