import { AdminLogService } from '../admin-log/admin-log.service';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { NoticeService } from './notice.service';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { InquiryInput, NoticeInput, NoticesInquiry, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NoticeResolver {
	constructor(
		private readonly noticeService: NoticeService,
		private readonly adminLogService: AdminLogService,
	) {}

	@Query(() => Notices)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
		return await this.noticeService.getNotices(input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notice)
	public async createInquiry(
		@Args('input') input: InquiryInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notice> {
		return await this.noticeService.createInquiry(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Notices)
	public async getMyInquiries(
		@Args('input') input: NoticesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notices> {
		return await this.noticeService.getMyInquiries(memberId, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Notices)
	public async getAllNoticesByAdmin(@Args('input') input: NoticesInquiry): Promise<Notices> {
		return await this.noticeService.getAllNoticesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async createNotice(@Args('input') input: NoticeInput, @AuthMember('_id') memberId: ObjectId): Promise<Notice> {
		const result = await this.noticeService.createNotice(memberId, input);
		await this.adminLogService.log(
			memberId,
			`NOTICE_CREATE`,
			'NOTICE',
			result._id,
			`${input.noticeCategory}: ${input.noticeTitle}`,
		);
		return result;
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async updateNoticeByAdmin(
		@Args('input') input: NoticeUpdate,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Notice> {
		await this.adminLogService.log(
			adminId,
			input.noticeAnswer ? 'INQUIRY_ANSWER' : 'NOTICE_UPDATE',
			'NOTICE',
			input._id,
			input.noticeStatus,
		);
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.noticeService.updateNoticeByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async removeNoticeByAdmin(
		@Args('noticeId') input: string,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Notice> {
		await this.adminLogService.log(adminId, 'NOTICE_REMOVE', 'NOTICE', input);
		return await this.noticeService.removeNoticeByAdmin(shapeIntoMongoObjectId(input));
	}
}
