import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notification, Notifications } from '../../libs/dto/notification/notification';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';

export interface NotifyInput {
	notificationType: NotificationType;
	notificationGroup: NotificationGroup;
	notificationTitle: string;
	authorId: ObjectId;
	receiverId: ObjectId;
	propertyId?: ObjectId;
	articleId?: ObjectId;
}

@Injectable()
export class NotificationService {
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	/** never throws: a failed notification must not break the action that triggered it */
	public async notify(input: NotifyInput): Promise<void> {
		if (!input.receiverId || String(input.authorId) === String(input.receiverId)) return;
		try {
			await this.notificationModel.create(input);
		} catch (err: any) {
			console.log('Error, notify:', err.message);
		}
	}

	public async getNotifications(memberId: ObjectId, input: OrdinaryInquiry): Promise<Notifications> {
		const match: T = { receiverId: memberId };
		const [result] = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{ $lookup: { from: 'members', localField: 'authorId', foreignField: '_id', as: 'authorData' } },
							{ $unwind: { path: '$authorData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		const unreadCount = await this.notificationModel
			.countDocuments({ receiverId: memberId, notificationStatus: NotificationStatus.WAIT })
			.exec();
		return { ...result, unreadCount } as Notifications;
	}

	public async markNotificationsRead(memberId: ObjectId): Promise<number> {
		const result = await this.notificationModel
			.updateMany(
				{ receiverId: memberId, notificationStatus: NotificationStatus.WAIT },
				{ notificationStatus: NotificationStatus.READ },
			)
			.exec();
		return result.modifiedCount;
	}
}
