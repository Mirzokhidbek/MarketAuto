import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import {
	NotificationCategory,
	NotificationGroup,
	NotificationStatus,
	NotificationType,
} from '../../enums/notification.enum';

@ObjectType()
export class Notification {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => NotificationType)
	notificationType!: NotificationType;

	@Field(() => NotificationStatus)
	notificationStatus!: NotificationStatus;

	@Field(() => NotificationGroup)
	notificationGroup!: NotificationGroup;

	@Field(() => String)
	notificationTitle!: string;

	@Field(() => String, { nullable: true })
	notificationDesc?: string;

	@Field(() => String)
	authorId!: ObjectId;

	@Field(() => String)
	receiverId!: ObjectId;

	@Field(() => String, { nullable: true })
	propertyId?: ObjectId;

	@Field(() => String, { nullable: true })
	articleId?: ObjectId;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	authorData?: Member;
}

@ObjectType()
export class UnreadByCategory {
	@Field(() => Int)
	activity!: number;

	@Field(() => Int)
	listings!: number;

	@Field(() => Int)
	alerts!: number;
}

@ObjectType()
export class Notifications {
	@Field(() => [Notification])
	list!: Notification[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];

	@Field(() => Int)
	unreadCount!: number;

	/** unread per inbox tab, for the tab badges */
	@Field(() => UnreadByCategory)
	unreadByCategory!: UnreadByCategory;
}

@InputType()
export class NotificationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(50)
	@Field(() => Int)
	limit!: number;

	/** only notifications the member has not read yet */
	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true })
	unreadOnly?: boolean;

	@IsOptional()
	@IsEnum(NotificationCategory)
	@Field(() => NotificationCategory, { nullable: true })
	category?: NotificationCategory;
}
