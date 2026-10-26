import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';

@ObjectType()
export class AdminLog {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => String)
	adminId!: ObjectId;

	@Field(() => String)
	action!: string;

	@Field(() => String)
	targetType!: string;

	@Field(() => String, { nullable: true })
	targetId?: string;

	@Field(() => String, { nullable: true })
	details?: string;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Member, { nullable: true })
	adminData?: Member;
}

@ObjectType()
export class AdminLogs {
	@Field(() => [AdminLog])
	list!: AdminLog[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}

@InputType()
export class AdminLogsInquiry {
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
	@Field(() => String, { nullable: true })
	targetType?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	targetId?: string;
}
