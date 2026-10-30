import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notifications, NotificationsInquiry } from '../../libs/dto/notification/notification';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getNotifications(
		@Args('input') input: NotificationsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		return await this.notificationService.getNotifications(memberId, input);
	}

	/** without ids: everything is marked read ("Mark all as read") */
	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async markNotificationsRead(
		@AuthMember('_id') memberId: ObjectId,
		@Args('ids', { type: () => [String], nullable: true }) ids?: string[],
	): Promise<number> {
		return await this.notificationService.markNotificationsRead(memberId, ids ?? undefined);
	}

	/** deletes the given notifications, or all read ones with readOnly: true ("Clear read") */
	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async removeNotifications(
		@AuthMember('_id') memberId: ObjectId,
		@Args('ids', { type: () => [String], nullable: true }) ids?: string[],
		@Args('readOnly', { type: () => Boolean, nullable: true }) readOnly?: boolean,
	): Promise<number> {
		return await this.notificationService.removeNotifications(memberId, ids ?? [], !!readOnly);
	}
}
