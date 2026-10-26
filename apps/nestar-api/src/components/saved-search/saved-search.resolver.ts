import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { SavedSearch, SavedSearchInput } from '../../libs/dto/saved-search/saved-search';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Message } from '../../libs/enums/common.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

const MAX_SAVED_SEARCHES = 10;
// keys a saved search may contain (same as the car search filters)
const allowedKeys = [
	'countryList', 'locationList', 'typeList', 'brandList', 'fuelList', 'transmissionList', 'options',
	'pricesRange', 'yearsRange', 'mileageRange', 'text', 'model', 'noAccident',
];

const toDto = (doc: any): SavedSearch => ({ ...doc, search: JSON.stringify(doc.search ?? {}) });

/** "notify me about new cars like this" — matching happens in PropertyService when a car goes on sale */
@Resolver()
export class SavedSearchResolver {
	constructor(@InjectModel('SavedSearch') private readonly savedSearchModel: Model<any>) {}

	@UseGuards(AuthGuard)
	@Query(() => [SavedSearch])
	public async getSavedSearches(@AuthMember('_id') memberId: ObjectId): Promise<SavedSearch[]> {
		const list = await this.savedSearchModel.find({ memberId }).sort({ createdAt: -1 }).lean().exec();
		return list.map(toDto);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => SavedSearch)
	public async saveSearch(@Args('input') input: SavedSearchInput, @AuthMember('_id') memberId: ObjectId): Promise<SavedSearch> {
		let parsed: Record<string, any>;
		try {
			parsed = JSON.parse(input.search);
		} catch (err) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
		const search = Object.fromEntries(Object.entries(parsed ?? {}).filter(([key]) => allowedKeys.includes(key)));
		if ((await this.savedSearchModel.countDocuments({ memberId })) >= MAX_SAVED_SEARCHES)
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const created = await this.savedSearchModel.create({ memberId, title: input.title.trim(), search });
		return toDto(created.toObject());
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async removeSavedSearch(@Args('id') id: string, @AuthMember('_id') memberId: ObjectId): Promise<boolean> {
		const result = await this.savedSearchModel.deleteOne({ _id: shapeIntoMongoObjectId(id), memberId }).exec();
		return result.deletedCount > 0;
	}
}
