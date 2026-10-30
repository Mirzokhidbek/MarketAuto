import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import { PriceEstimate } from '../../libs/dto/property/price-estimate';
import { Message } from '../../libs/enums/common.enum';
import { PriceCurrency, PropertyStatus } from '../../libs/enums/property.enum';
import { searchRegex } from '../../libs/config';
import { T } from '../../libs/types/common';
import { ExchangeService } from '../exchange/exchange.service';

/** prices of listings: USD normalisation and the "is this a good price?" estimate */
@Injectable()
export class PropertyPricingService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		private readonly exchangeService: ExchangeService,
	) {}

	/**
	 * propertyPrice is always stored in USD. A price typed in so'm keeps its original amount for display
	 * and gets a USD value (today's Central Bank rate) for filters and sorting.
	 */
	public async normalizePrice(input: PropertyInput | PropertyUpdate): Promise<void> {
		if (input.propertyPriceCurrency === PriceCurrency.UZS) {
			input.propertyPriceOriginal = input.propertyPrice;
			input.propertyPrice = await this.exchangeService.uzsToUsd(input.propertyPrice as number);
		} else if (input.propertyPrice !== undefined) {
			input.propertyPriceCurrency = PriceCurrency.USD;
			(input as T).propertyPriceOriginal = null;
		}
	}

	/**
	 * "Is this a good price?": compares with the same brand + model, year ±1, in USD.
	 * Needs at least 3 other cars, otherwise there is no verdict.
	 */
	public async getPriceEstimate(propertyId: ObjectId): Promise<PriceEstimate> {
		const car = await this.propertyModel.findById(propertyId).lean().exec();
		if (!car) throw new NotFoundException(Message.NO_DATA_FOUND);
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
}
