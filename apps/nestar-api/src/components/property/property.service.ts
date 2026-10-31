import { AdminLogService } from '../admin-log/admin-log.service';
import { BulkModerationInput } from '../../libs/dto/property/property.update';
import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import {
	AgentPropertiesInquiry,
	AllPropertiesInquiry,
	OrdinaryInquiry,
	PropertiesInquiry,
	PropertyInput,
} from '../../libs/dto/property/property.input';
import { Properties, Property } from '../../libs/dto/property/property';
import { Direction, Message } from '../../libs/enums/common.enum';
import { ViewService } from '../view/view.service';
import { CarBrand, CarCountry, PropertyStatus } from '../../libs/enums/property.enum';
import { PropertyPricingService } from './property-pricing.service';
import { PropertyAlertsService } from './property-alerts.service';
import { shapePropertyMatch } from './property.query';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import moment from 'moment';
import {
	lookupAuthMemberLiked,
	lookupMember,
	lookupMemberForAdmin,
	shapeIntoMongoObjectId,
	searchRegex,
} from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

const logger = new Logger('PropertyService');

@Injectable()
export class PropertyService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
		private storageService: StorageService,
		private pricing: PropertyPricingService,
		private alerts: PropertyAlertsService,
		private adminLogService: AdminLogService,
	) {}

	public async createProperty(input: PropertyInput): Promise<Property> {
		if (!(await this.memberService.hasVerifiedPhone(input.memberId as ObjectId)))
			throw new BadRequestException(Message.PHONE_REQUIRED);
		if (input.carCountry === CarCountry.UZBEKISTAN && !input.propertyLocation) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (input.carCountry !== CarCountry.UZBEKISTAN) delete input.propertyLocation;
		if (input.carVin) input.carVin = input.carVin.toUpperCase();
		// photos must be files uploaded to our property folder (not paths to other sellers' photos)
		if (input.propertyImages?.some((image) => !this.storageService.isOwnPath(image, 'property', input.memberId)))
			throw new BadRequestException(Message.BAD_REQUEST);
		await this.pricing.normalizePrice(input);

		// the same seller cannot publish the same car twice
		const duplicate = await this.propertyModel.exists({
			memberId: input.memberId,
			carBrand: input.carBrand,
			carModel: { $regex: searchRegex(input.carModel) },
			carYear: input.carYear,
			carMileage: input.carMileage,
			propertyStatus: { $in: [PropertyStatus.PENDING, PropertyStatus.ACTIVE] },
		});
		if (duplicate) throw new BadRequestException(Message.DUPLICATE_LISTING);

		// new sellers' listings wait for moderation; trusted sellers publish instantly
		const trusted = await this.memberService.isTrusted(input.memberId as ObjectId);
		const propertyStatus = trusted ? PropertyStatus.ACTIVE : PropertyStatus.PENDING;
		let result: Property;
		try {
			result = await this.propertyModel.create({ ...input, propertyStatus });
		} catch (err: any) {
			logger.warn(`Error, Service.model: ${err.message}`);
			throw new BadRequestException(err?.code === 11000 ? Message.DUPLICATE_LISTING : Message.CREATE_FAILED);
		}
		if (propertyStatus === PropertyStatus.ACTIVE) {
			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberProperties', modifier: 1 });
			void this.alerts.notifySavedSearches(result);
		}
		return result;
	}

	public async getProperty(memberId: ObjectId, propertyId: ObjectId, isAdmin = false): Promise<Property> {
		// sold cars stay viewable (marked as sold); a pending listing only for its owner; deleted ones are gone
		const search: T = {
			_id: propertyId,
			$or: [
				{ propertyStatus: { $in: [PropertyStatus.ACTIVE, PropertyStatus.SOLD] } },
				// a pending listing: its owner and moderators can open it
				...(isAdmin
					? [{ propertyStatus: { $in: [PropertyStatus.PENDING, PropertyStatus.REJECTED] } }]
					: memberId
						? [{ propertyStatus: { $in: [PropertyStatus.PENDING, PropertyStatus.REJECTED] }, memberId }]
						: []),
			],
		};

		const targetProperty: Property | null = await this.propertyModel.findOne(search).lean().exec();
		if (!targetProperty) throw new NotFoundException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
				targetProperty.propertyViews++;
			}

			// meLiked
			const likeInput = { memberId: memberId, likeRefId: propertyId, likeGroup: LikeGroup.PROPERTY };
			targetProperty.meLiked = await this.likeService.checkLikeExistence(likeInput);
		}

		targetProperty.memberData = await this.memberService.getMember(null, targetProperty.memberId);
		return targetProperty;
	}

	public async updateProperty(memberId: ObjectId, input: PropertyUpdate): Promise<Property> {
		// owners can edit pending, active and sold cars; deleted ones are final
		const search: T = { _id: input._id, memberId: memberId, propertyStatus: { $ne: PropertyStatus.DELETE } };
		const current = await this.propertyModel.findOne(search).select('propertyStatus').lean().exec();
		// only an admin can publish a listing that waits for moderation or set REJECTED
		if (input.propertyStatus === PropertyStatus.PENDING || input.propertyStatus === PropertyStatus.REJECTED)
			delete input.propertyStatus;
		if (input.propertyStatus === PropertyStatus.ACTIVE && current?.propertyStatus === PropertyStatus.PENDING)
			delete input.propertyStatus;
		// a rejected listing that the owner fixed goes back to the moderation queue
		if (current?.propertyStatus === PropertyStatus.REJECTED && input.propertyStatus !== PropertyStatus.DELETE) {
			input.propertyStatus = PropertyStatus.PENDING;
		}
		delete input.propertyRejectReason;
		return await this.changeProperty(search, input);
	}

	/** shared by owner and admin updates: keeps soldAt/deletedAt and the seller's active car counter in sync */
	private async changeProperty(search: T, input: PropertyUpdate): Promise<Property> {
		// city list applies only to cars located in Uzbekistan
		if (input.carCountry && input.carCountry !== CarCountry.UZBEKISTAN) (input as T).propertyLocation = null;

		const current: Property | null = await this.propertyModel.findOne(search).lean().exec();
		if (!current) throw new BadRequestException(Message.UPDATE_FAILED);

		// new photos must be the seller's own uploads (also when an admin edits); photos already on the listing may stay
		if (input.propertyImages) {
			const existing = new Set(current.propertyImages);
			const isNewForeign = (image: string) =>
				!existing.has(image) && !this.storageService.isOwnPath(image, 'property', current.memberId);
			if (input.propertyImages.some(isNewForeign)) throw new BadRequestException(Message.BAD_REQUEST);
		}

		const prevStatus = current.propertyStatus;
		const nextStatus = input.propertyStatus ?? prevStatus;
		// leaving REJECTED (fixed and resubmitted, or approved): the old reason no longer applies
		if (prevStatus === PropertyStatus.REJECTED && nextStatus !== PropertyStatus.REJECTED)
			(input as T).propertyRejectReason = null;
		if (nextStatus !== prevStatus) {
			if (nextStatus === PropertyStatus.SOLD) input.soldAt = moment().toDate();
			if (nextStatus === PropertyStatus.DELETE) input.deletedAt = moment().toDate();
			if (nextStatus === PropertyStatus.ACTIVE) (input as T).soldAt = null;
		}

		if (input.carVin) input.carVin = input.carVin.toUpperCase();
		if (input.propertyPrice !== undefined) await this.pricing.normalizePrice(input);
		const result = await this.propertyModel.findByIdAndUpdate(current._id, input, { new: true }).exec();
		if (!result) throw new BadRequestException(Message.UPDATE_FAILED);

		// photos removed from the listing are deleted from storage
		if (input.propertyImages) {
			const kept = new Set(input.propertyImages);
			await this.storageService.removeImages(current.propertyImages.filter((image) => !kept.has(image)));
		}

		// memberProperties counts only cars that are currently for sale
		const wasActive = prevStatus === PropertyStatus.ACTIVE;
		const isActive = nextStatus === PropertyStatus.ACTIVE;
		if (wasActive !== isActive) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberProperties',
				modifier: isActive ? 1 : -1,
			});
		}

		// everyone who saved this car hears about a lower price
		if (nextStatus === PropertyStatus.ACTIVE && result.propertyPrice < current.propertyPrice) {
			await this.alerts.notifyPriceDrop(result);
		}

		// moderation result for the seller (approved, or rejected with the reason)
		const approved = prevStatus === PropertyStatus.PENDING && nextStatus === PropertyStatus.ACTIVE;
		const rejected = nextStatus === PropertyStatus.REJECTED && prevStatus !== PropertyStatus.REJECTED;
		if (approved) await this.memberService.markTrusted(result.memberId);
		if (approved || rejected) {
			await this.notificationService.notify({
				notificationType: approved ? NotificationType.LISTING_APPROVED : NotificationType.LISTING_REJECTED,
				notificationGroup: NotificationGroup.PROPERTY,
				notificationTitle: result.propertyTitle,
				notificationDesc: rejected ? result.propertyRejectReason : undefined,
				authorId: result.memberId, // system message: shown without an author
				receiverId: result.memberId,
				propertyId: result._id,
				system: true,
			});
		}
		// a car that just went on sale may match someone's saved search
		if (!wasActive && isActive && prevStatus !== PropertyStatus.SOLD) void this.alerts.notifySavedSearches(result);

		return result;
	}

	public async getProperties(memberId: ObjectId, input: PropertiesInquiry): Promise<Properties> {
		const match: T = { propertyStatus: PropertyStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		shapePropertyMatch(match, input);
		// cars of blocked or deleted sellers are hidden from buyers. Such sellers are few, so they are excluded
		// by id; the seller is joined only to the cars of the requested page, not to every matching car
		const hiddenSellers = await this.memberService.inactiveMemberIds();
		if (hiddenSellers.length)
			match.memberId = match.memberId ? { $eq: match.memberId, $nin: hiddenSellers } : { $nin: hiddenSellers };

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
							// meLiked
							lookupAuthMemberLiked(memberId),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	public async getCarModels(brand: CarBrand): Promise<string[]> {
		const models: string[] = await this.propertyModel
			.distinct('carModel', { carBrand: brand, propertyStatus: { $in: [PropertyStatus.ACTIVE, PropertyStatus.SOLD] } })
			.exec();
		// "K5", "k5 " -> one entry
		const unique = new Map(models.map((model) => [model.trim().toLowerCase(), model.trim()]));
		return [...unique.values()].sort((a, b) => a.localeCompare(b));
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> {
		return await this.likeService.getFavoriteProperties(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Properties> {
		return await this.viewService.getVisitedProperties(memberId, input);
	}

	public async getAgentProperties(memberId: ObjectId, input: AgentPropertiesInquiry): Promise<Properties> {
		const { propertyStatus } = input.search;
		if (propertyStatus === PropertyStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId: memberId,
			propertyStatus: propertyStatus ?? { $ne: PropertyStatus.DELETE },
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId): Promise<Property> {
		const target: Property | null = await this.propertyModel
			.findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })
			.exec();
		if (!target) throw new NotFoundException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.PROPERTY,
		};

		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.propertyStatsEditor({ _id: likeRefId, targetKey: 'propertyLikes', modifier: modifier });
		if (modifier > 0) {
			await this.notificationService.notify({
				notificationType: NotificationType.LIKE,
				notificationGroup: NotificationGroup.PROPERTY,
				notificationTitle: target.propertyTitle,
				authorId: memberId,
				receiverId: target.memberId,
				propertyId: likeRefId,
			});
		}

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllPropertiesByAdmin(input: AllPropertiesInquiry): Promise<Properties> {
		const { propertyStatus, propertyLocationList, countryList, brandList, text, memberId } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (propertyStatus) match.propertyStatus = propertyStatus;
		if (propertyLocationList?.length) match.propertyLocation = { $in: propertyLocationList };
		if (countryList?.length) match.carCountry = { $in: countryList };
		if (brandList?.length) match.carBrand = { $in: brandList };
		if (text) match.propertyTitle = { $regex: searchRegex(text) };
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMemberForAdmin,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	public async updatePropertyByAdmin(input: PropertyUpdate, adminId?: ObjectId): Promise<Property> {
		if (input.propertyStatus === PropertyStatus.REJECTED && !input.propertyRejectReason?.trim())
			throw new BadRequestException(Message.REJECT_REASON_REQUIRED);
		// admin can move a car between any statuses (e.g. restore a deleted or sold listing)
		const before = await this.propertyModel.findById(input._id).select('propertyStatus').lean().exec();
		const result = await this.changeProperty({ _id: input._id }, input);
		if (input.propertyStatus && input.propertyStatus !== before?.propertyStatus) {
			const action =
				input.propertyStatus === PropertyStatus.ACTIVE && before?.propertyStatus === PropertyStatus.PENDING
					? 'PROPERTY_APPROVE'
					: `PROPERTY_${input.propertyStatus}`;
			await this.adminLogService.log(
				adminId,
				action,
				'PROPERTY',
				result._id,
				`${result.propertyTitle}${input.propertyRejectReason ? ': ' + input.propertyRejectReason : ''}`,
			);
		}
		return result;
	}

	/** approve or reject many listings at once (moderation queue) */
	public async bulkModerateByAdmin(input: BulkModerationInput, adminId?: ObjectId): Promise<number> {
		let done = 0;
		for (const id of input.ids) {
			try {
				await this.updatePropertyByAdmin(
					{
						_id: shapeIntoMongoObjectId(id),
						propertyStatus: input.propertyStatus,
						propertyRejectReason: input.propertyRejectReason,
					},
					adminId,
				);
				done++;
			} catch (err: any) {
				logger.warn(`bulk moderation skipped ${id}: ${err.message}`);
			}
		}
		return done;
	}

	public async removePropertyByAdmin(propertyId: ObjectId, adminId?: ObjectId): Promise<Property> {
		const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
		const result = await this.propertyModel.findOneAndDelete(search).exec();
		if (!result) throw new BadRequestException(Message.REMOVE_FAILED);
		await this.storageService.removeImages(result.propertyImages);
		await this.adminLogService.log(adminId, 'PROPERTY_REMOVE', 'PROPERTY', result._id, result.propertyTitle);

		return result;
	}

	public async propertyStatsEditor(input: StatisticModifier): Promise<Property> {
		const { _id, targetKey, modifier } = input;
		const updatedProperty = await this.propertyModel
			.findByIdAndUpdate(
				_id,
				{ $inc: { [targetKey]: modifier } },
				{
					new: true,
				},
			)
			.exec();

		if (!updatedProperty) {
			throw new NotFoundException(Message.NO_DATA_FOUND);
		}

		return updatedProperty;
	}
}
