import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications, NotificationsInquiry } from '../../libs/dto/notification/notification';
import {
	NOTIFICATION_CATEGORY_TYPES,
	NotificationCategory,
	NotificationGroup,
	NotificationStatus,
	NotificationType,
} from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { lookupPublicMember, idString, shapeIntoMongoObjectId } from '../../libs/config';
import { SocketGateway } from '../../socket/socket.gateway';

const logger = new Logger('NotificationService');

// one request changes at most one page of notifications; invalid ids are rejected by shapeIntoMongoObjectId
const MAX_IDS = 100;
const toObjectIds = (ids: string[]): unknown[] =>
	ids.slice(0, MAX_IDS).map((id): unknown => shapeIntoMongoObjectId(id));

export interface NotifyInput {
	notificationType: NotificationType;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	notificationDesc?: string;
	authorId: ObjectId;
	receiverId: ObjectId;
	propertyId?: ObjectId;
	articleId?: ObjectId;
	system?: boolean; // moderation messages: sent to the author himself
}

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<Notification>,
		private readonly socketGateway: SocketGateway,
	) {}

	/** never throws: a failed notification must not break the action that triggered it */
	public async notify(input: NotifyInput): Promise<void> {
		if (!input.receiverId || (!input.system && idString(input.authorId) === idString(input.receiverId))) return;
		try {
			const { system, ...data } = input;
			const created = await this.notificationModel.create(data);
			// live: the bell of every open tab of the receiver updates at once (polling stays as a fallback)
			this.socketGateway.emitToMember(idString(input.receiverId), {
				event: 'notification',
				notification: { _id: idString(created._id), notificationType: created.notificationType },
			});
		} catch (err: any) {
			logger.warn(`Error, notify: ${err.message}`);
		}
	}

	public async getNotifications(memberId: ObjectId, input: NotificationsInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		if (input.unreadOnly) match.notificationStatus = NotificationStatus.WAIT;
		if (input.category) match.notificationType = { $in: NOTIFICATION_CATEGORY_TYPES[input.category] };
		const [result] = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1, _id: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupPublicMember('authorId', 'authorData'),
							{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		// one pass over the member's unread notifications gives the total and the per-tab badges
		const unread: { _id: NotificationType; count: number }[] = await this.notificationModel
			.aggregate([
				{ $match: { receiverId: memberId, notificationStatus: NotificationStatus.WAIT } },
				{ $group: { _id: '$notificationType', count: { $sum: 1 } } },
			])
			.exec();
		const countOf = (category: NotificationCategory) =>
			unread
				.filter((row) => NOTIFICATION_CATEGORY_TYPES[category].includes(row._id))
				.reduce((sum, row) => sum + row.count, 0);
		return {
			...result,
			unreadCount: unread.reduce((sum, row) => sum + row.count, 0),
			unreadByCategory: {
				activity: countOf(NotificationCategory.ACTIVITY),
				listings: countOf(NotificationCategory.LISTINGS),
				alerts: countOf(NotificationCategory.ALERTS),
			},
		} as Notifications;
	}

	/** marks the given notifications read, or all of the member's when no ids are given; returns how many changed */
	public async markNotificationsRead(memberId: ObjectId, ids?: string[]): Promise<number> {
		const filter: T = { receiverId: memberId, notificationStatus: NotificationStatus.WAIT };
		if (ids?.length) filter._id = { $in: toObjectIds(ids) };
		const result = await this.notificationModel
			.updateMany(filter, { notificationStatus: NotificationStatus.READ })
			.exec();
		return result.modifiedCount;
	}

	/** deletes the given notifications, or every read one when `readOnly` is set; only the member's own */
	public async removeNotifications(memberId: ObjectId, ids: string[], readOnly = false): Promise<number> {
		const filter: T = { receiverId: memberId };
		if (!readOnly && !ids.length) return 0;
		if (readOnly) filter.notificationStatus = NotificationStatus.READ;
		else filter._id = { $in: toObjectIds(ids) };
		const result = await this.notificationModel.deleteMany(filter).exec();
		return result.deletedCount;
	}
}
