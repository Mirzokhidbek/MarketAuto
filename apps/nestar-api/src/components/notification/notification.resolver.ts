import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notifications } from '../../libs/dto/notification/notification';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getNotifications(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getNotifications');
		return await this.notificationService.getNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async markNotificationsRead(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		console.log('Mutation: markNotificationsRead');
		return await this.notificationService.markNotificationsRead(memberId);
	}
}
