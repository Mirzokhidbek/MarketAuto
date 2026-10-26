import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ReportReason, ReportStatus } from '../../enums/property.enum';
import { Member, TotalCounter } from '../member/member';
import { Property } from '../property/property';

@ObjectType()
export class Report {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => String)
	propertyId!: ObjectId;

	@Field(() => String)
	memberId!: ObjectId;

	@Field(() => ReportReason)
	reportReason!: ReportReason;

	@Field(() => String, { nullable: true })
	reportComment?: string;

	@Field(() => ReportStatus)
	reportStatus!: ReportStatus;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => Property, { nullable: true })
	propertyData?: Property;
}

@ObjectType()
export class Reports {
	@Field(() => [Report])
	list!: Report[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}

@InputType()
export class ReportInput {
	@IsNotEmpty()
	@Field(() => String)
	propertyId!: string;

	@IsNotEmpty()
	@Field(() => ReportReason)
	reportReason!: ReportReason;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	reportComment?: string;
}

@InputType()
export class ReportsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@Field(() => ReportStatus, { nullable: true })
	reportStatus?: ReportStatus;
}

@InputType()
export class ResolveReportInput {
	@IsNotEmpty()
	@Field(() => String)
	reportId!: string;

	/** DISMISS: listing is fine; REMOVE_LISTING: listing is deleted and every report on it is closed */
	@IsNotEmpty()
	@IsIn(['DISMISS', 'REMOVE_LISTING'])
	@Field(() => String)
	action!: 'DISMISS' | 'REMOVE_LISTING';
}
