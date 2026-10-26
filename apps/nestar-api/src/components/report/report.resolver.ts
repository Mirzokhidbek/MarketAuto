import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { ReportService } from './report.service';
import { Report, ReportInput, Reports, ReportsInquiry, ResolveReportInput } from '../../libs/dto/report/report';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver()
export class ReportResolver {
	constructor(private readonly reportService: ReportService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Report)
	public async reportProperty(@Args('input') input: ReportInput, @AuthMember('_id') memberId: ObjectId): Promise<Report> {
		console.log('Mutation: reportProperty');
		return await this.reportService.reportProperty(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Reports)
	public async getReportsByAdmin(@Args('input') input: ReportsInquiry): Promise<Reports> {
		return await this.reportService.getReportsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Report)
	public async resolveReport(@Args('input') input: ResolveReportInput): Promise<Report> {
		console.log('Mutation: resolveReport');
		return await this.reportService.resolveReport(input);
	}
}
