import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { T } from '../../libs/types/common';
import { LikeService } from '../like/like.service';
import { NotificationService } from '../notification/notification.service';
import { shapePropertyMatch } from './property.query';

const logger = new Logger('PropertyAlertsService');

/** notifications about listings: price drops for likers, new matches for saved searches */
@Injectable()
export class PropertyAlertsService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('SavedSearch') private readonly savedSearchModel: Model<any>,
		private readonly likeService: LikeService,
		private readonly notificationService: NotificationService,
	) {}

	/** members who liked the car hear that its price went down */
	public async notifyPriceDrop(property: Property): Promise<void> {
		const likes = await this.likeService.findLikers(property._id, LikeGroup.PROPERTY);
		for (const memberId of likes) {
			await this.notificationService.notify({
				notificationType: NotificationType.PRICE_DROP,
				notificationGroup: NotificationGroup.PROPERTY,
				notificationTitle: property.propertyTitle,
				authorId: property.memberId,
				receiverId: memberId,
				propertyId: property._id,
			});
		}
	}

	/**
	 * tells members whose saved search matches this newly published car. Only searches that can match on the
	 * simple list/range filters are loaded (not every saved search), each member is notified once per car.
	 * Runs in the background: publishing a car does not wait for it.
	 */
	public async notifySavedSearches(property: Property): Promise<void> {
		try {
			const anyOf = (field: string, value: unknown) => ({
				$or: [{ [field]: null }, { [field]: { $size: 0 } }, { [field]: value }],
			});
			const inRange = (field: string, value: number) => ({
				$or: [{ [field]: null }, { [`${field}.start`]: { $lte: value }, [`${field}.end`]: { $gte: value } }],
			});
			const candidates = this.savedSearchModel
				.find({
					memberId: { $ne: property.memberId },
					$and: [
						anyOf('search.brandList', property.carBrand),
						anyOf('search.countryList', property.carCountry),
						anyOf('search.typeList', property.propertyType),
						anyOf('search.fuelList', property.carFuel),
						anyOf('search.transmissionList', property.carTransmission),
						inRange('search.pricesRange', property.propertyPrice),
						inRange('search.yearsRange', property.carYear),
					],
				})
				.lean()
				.cursor();

			const notified = new Set<string>();
			for await (const saved of candidates) {
				if (notified.has(String(saved.memberId))) continue;
				// the remaining filters (text, model, mileage, options, ...) are checked exactly
				const match: T = { _id: property._id };
				shapePropertyMatch(match, { page: 1, limit: 1, search: saved.search ?? {} });
				if (!(await this.propertyModel.exists(match))) continue;
				notified.add(String(saved.memberId));
				await this.notificationService.notify({
					notificationType: NotificationType.NEW_LISTING,
					notificationGroup: NotificationGroup.PROPERTY,
					notificationTitle: property.propertyTitle,
					authorId: property.memberId,
					receiverId: saved.memberId,
					propertyId: property._id,
				});
				await this.savedSearchModel.updateOne({ _id: saved._id }, { lastNotifiedAt: new Date() }).exec();
			}
		} catch (err: any) {
			logger.warn(`Error, notifySavedSearches: ${err.message}`);
		}
	}
}
