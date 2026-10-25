import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@IsIn([NoticeCategory.FAQ, NoticeCategory.NOTICE, NoticeCategory.TERMS])
	@Field(() => NoticeCategory)
	noticeCategory!: NoticeCategory;

	@IsNotEmpty()
	@Length(3, 150)
	@Field(() => String)
	noticeTitle!: string;

	@IsNotEmpty()
	@Length(3, 5000)
	@Field(() => String)
	noticeContent!: string;

	memberId?: ObjectId;
}

@InputType()
export class InquiryInput {
	@IsNotEmpty()
	@Length(3, 150)
	@Field(() => String)
	noticeTitle!: string;

	@IsNotEmpty()
	@Length(10, 3000)
	@Field(() => String)
	noticeContent!: string;
}

@InputType()
export class NoticeUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: ObjectId;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Length(3, 150)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@Length(3, 5000)
	@Field(() => String, { nullable: true })
	noticeContent?: string;

	@IsOptional()
	@Length(1, 3000)
	@Field(() => String, { nullable: true })
	noticeAnswer?: string;
}

@InputType()
class NISearch {
	@IsOptional()
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class NoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsNotEmpty()
	@Field(() => NISearch)
	search!: NISearch;
}
