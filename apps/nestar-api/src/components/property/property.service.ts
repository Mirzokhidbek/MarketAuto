import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
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
import { CarAccidentHistory, CarBrand, CarCountry, PriceCurrency, PropertyStatus } from '../../libs/enums/property.enum';
import { ExchangeService } from '../exchange/exchange.service';
import { PriceEstimate } from '../../libs/dto/property/price-estimate';
import { MemberStatus } from '../../libs/enums/member.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import moment from 'moment';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId, searchRegex } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class PropertyService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		private memberService: MemberService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
		private storageService: StorageService,
		private exchangeService: ExchangeService,
		@InjectModel('SavedSearch') private readonly savedSearchModel: Model<any>,
	) {}

	public async createProperty(input: PropertyInput): Promise<Property> {
		if (input.carCountry === CarCountry.UZBEKISTAN && !input.propertyLocation) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		if (input.carCountry !== CarCountry.UZBEKISTAN) delete input.propertyLocation;
		if (input.carVin) input.carVin = input.carVin.toUpperCase();
		await this.normalizePrice(input);

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
			console.log('Error, Service.model:', err.message);
			throw new BadRequestException(err?.code === 11000 ? Message.DUPLICATE_LISTING : Message.CREATE_FAILED);
		}
		if (propertyStatus === PropertyStatus.ACTIVE) {
			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberProperties', modifier: 1 });
			await this.notifySavedSearches(result);
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
				...(isAdmin ? [{ propertyStatus: PropertyStatus.PENDING }] : memberId ? [{ propertyStatus: PropertyStatus.PENDING, memberId }] : []),
			],
		};

		const targetProperty: Property | null = await this.propertyModel.findOne(search).lean().exec();
		if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

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
		// only an admin can publish a listing that waits for moderation
		if (input.propertyStatus === PropertyStatus.ACTIVE || input.propertyStatus === PropertyStatus.PENDING) {
			const current = await this.propertyModel.findOne(search).select('propertyStatus').lean().exec();
			if (current?.propertyStatus === PropertyStatus.PENDING) delete input.propertyStatus;
			if (input.propertyStatus === PropertyStatus.PENDING) delete input.propertyStatus;
		}
		return await this.changeProperty(search, input);
	}

	/** shared by owner and admin updates: keeps soldAt/deletedAt and the seller's active car counter in sync */
	private async changeProperty(search: T, input: PropertyUpdate): Promise<Property> {
		// city list applies only to cars located in Uzbekistan
		if (input.carCountry && input.carCountry !== CarCountry.UZBEKISTAN) (input as T).propertyLocation = null;

		const current: Property | null = await this.propertyModel.findOne(search).lean().exec();
		if (!current) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const prevStatus = current.propertyStatus;
		const nextStatus = input.propertyStatus ?? prevStatus;
		if (nextStatus !== prevStatus) {
			if (nextStatus === PropertyStatus.SOLD) input.soldAt = moment().toDate();
			if (nextStatus === PropertyStatus.DELETE) input.deletedAt = moment().toDate();
			if (nextStatus === PropertyStatus.ACTIVE) (input as T).soldAt = null;
		}

		if (input.carVin) input.carVin = input.carVin.toUpperCase();
		if (input.propertyPrice !== undefined) await this.normalizePrice(input);
		const result = await this.propertyModel.findByIdAndUpdate(current._id, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

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
			await this.notifyPriceDrop(result);
		}

		// moderation result for the seller
		if (prevStatus === PropertyStatus.PENDING && nextStatus !== PropertyStatus.PENDING) {
			const approved = nextStatus === PropertyStatus.ACTIVE;
			if (approved) await this.memberService.markTrusted(result.memberId);
			await this.notificationService.notify({
				notificationType: approved ? NotificationType.LISTING_APPROVED : NotificationType.LISTING_REJECTED,
				notificationGroup: NotificationGroup.PROPERTY,
				notificationTitle: result.propertyTitle,
				authorId: result.memberId, // system message: shown without an author
				receiverId: result.memberId,
				propertyId: result._id,
				system: true,
			});
		}
		// a car that just went on sale may match someone's saved search
		if (!wasActive && isActive && prevStatus !== PropertyStatus.SOLD) await this.notifySavedSearches(result);

		return result;
	}

	/**
	 * propertyPrice is always stored in USD. A price typed in so'm keeps its original amount for display
	 * and gets a USD value (today's Central Bank rate) for filters and sorting.
	 */
	private async normalizePrice(input: PropertyInput | PropertyUpdate): Promise<void> {
		if (input.propertyPriceCurrency === PriceCurrency.UZS) {
			input.propertyPriceOriginal = input.propertyPrice;
			input.propertyPrice = await this.exchangeService.uzsToUsd(input.propertyPrice as number);
		} else if (input.propertyPrice !== undefined) {
			input.propertyPriceCurrency = PriceCurrency.USD;
			(input as T).propertyPriceOriginal = null;
		}
	}

	private async notifyPriceDrop(property: Property): Promise<void> {
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
	 * "Is this a good price?": compares with the same brand + model, year ±1, in USD.
	 * Needs at least 3 other cars, otherwise there is no verdict.
	 */
	public async getPriceEstimate(propertyId: ObjectId): Promise<PriceEstimate> {
		const car = await this.propertyModel.findById(propertyId).lean().exec();
		if (!car) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const [stats] = await this.propertyModel
			.aggregate([
				{
					$match: {
						_id: { $ne: car._id },
						carBrand: car.carBrand,
						carModel: { $regex: searchRegex(car.carModel) },
						carYear: { $gte: car.carYear - 1, $lte: car.carYear + 1 },
						propertyStatus: { $in: [PropertyStatus.ACTIVE, PropertyStatus.SOLD] },
					},
				},
				{ $group: { _id: null, average: { $avg: '$propertyPrice' }, count: { $sum: 1 } } },
			])
			.exec();
		const count: number = stats?.count ?? 0;
		const average = count ? Math.round(stats.average) : 0;
		let verdict = 'UNKNOWN';
		if (count >= 3) {
			const ratio = car.propertyPrice / average;
			verdict = ratio <= 0.92 ? 'LOW' : ratio >= 1.08 ? 'HIGH' : 'FAIR';
		}
		return { average, count, verdict };
	}

	/** tells members whose saved search matches this newly published car */
	private async notifySavedSearches(property: Property): Promise<void> {
		try {
			const searches = await this.savedSearchModel.find({ memberId: { $ne: property.memberId } }).lean().exec();
			for (const saved of searches) {
				const match: T = { _id: property._id };
				this.shapeMatchQuery(match, { page: 1, limit: 1, search: saved.search ?? {} } as PropertiesInquiry);
				if (!(await this.propertyModel.exists(match))) continue;
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
			console.log('Error, notifySavedSearches:', err.message);
		}
	}

	public async getProperties(memberId: ObjectId, input: PropertiesInquiry): Promise<Properties> {
		const match: T = { propertyStatus: PropertyStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);

		const result = await this.propertyModel
			.aggregate([
				{ $match: match },
				// cars of blocked or deleted sellers are hidden from buyers
				lookupMember,
				{ $unwind: '$memberData' },
				{ $match: { 'memberData.memberStatus': MemberStatus.ACTIVE } },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
							lookupAuthMemberLiked(memberId),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	/** also used to test new cars against members' saved searches */
	public shapeMatchQuery(match: T, input: PropertiesInquiry): void {
		const {
			memberId,
			countryList,
			locationList,
			typeList,
			brandList,
			fuelList,
			transmissionList,
			periodsRange,
			pricesRange,
			yearsRange,
			mileageRange,
			options,
			text,
			model,
			noAccident,
		} = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (countryList && countryList.length) match.carCountry = { $in: countryList };
		if (locationList && locationList.length) match.propertyLocation = { $in: locationList };
		if (typeList && typeList.length) match.propertyType = { $in: typeList };
		if (brandList && brandList.length) match.carBrand = { $in: brandList };
		if (fuelList && fuelList.length) match.carFuel = { $in: fuelList };
		if (transmissionList && transmissionList.length) match.carTransmission = { $in: transmissionList };

		if (pricesRange) match.propertyPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (yearsRange) match.carYear = { $gte: yearsRange.start, $lte: yearsRange.end };
		if (mileageRange) match.carMileage = { $gte: mileageRange.start, $lte: mileageRange.end };

		if (text) match.propertyTitle = { $regex: searchRegex(text) };
		if (model) match.carModel = { $regex: searchRegex(model) };
		if (noAccident) match.carAccidentHistory = CarAccidentHistory.NONE;
		// every ticked option must hold (barter AND customs cleared, ...)
		options?.forEach((ele) => (match[ele] = true));
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
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId): Promise<Property> {
		const target: Property | null = await this.propertyModel
			.findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

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
		const { propertyStatus, propertyLocationList, countryList, brandList, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (propertyStatus) match.propertyStatus = propertyStatus;
		if (propertyLocationList?.length) match.propertyLocation = { $in: propertyLocationList };
		if (countryList?.length) match.carCountry = { $in: countryList };
		if (brandList?.length) match.carBrand = { $in: brandList };
		if (text) match.propertyTitle = { $regex: searchRegex(text) };

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
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0] as Properties;
	}

	public async updatePropertyByAdmin(input: PropertyUpdate): Promise<Property> {
		// admin can move a car between any statuses (e.g. restore a deleted or sold listing)
		return await this.changeProperty({ _id: input._id }, input);
	}

	public async removePropertyByAdmin(propertyId: ObjectId): Promise<Property> {
		const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
		const result = await this.propertyModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		await this.storageService.removeImages(result.propertyImages);

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
			throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		}

		return updatedProperty;
	}
}
