import { Schema } from 'mongoose';
import {
	CarAccidentHistory,
	PriceCurrency,
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyStatus,
	PropertyType,
} from '../libs/enums/property.enum';

const PropertySchema = new Schema(
	{
		propertyType: {
			type: String,
			enum: PropertyType,
			required: true,
		},

		propertyStatus: {
			type: String,
			enum: PropertyStatus,
			default: PropertyStatus.PENDING,
		},

		carCountry: {
			type: String,
			enum: CarCountry,
			required: true,
		},

		/** Uzbek city; required only when carCountry is UZBEKISTAN **/
		propertyLocation: {
			type: String,
			enum: PropertyLocation,
		},

		propertyAddress: {
			type: String,
			required: true,
		},

		propertyTitle: {
			type: String,
			required: true,
		},

		// always USD: used for filters, sorting and the price estimate
		propertyPrice: {
			type: Number,
			required: true,
		},

		// what the seller actually typed (e.g. 300 000 000 so'm), shown as is
		propertyPriceCurrency: {
			type: String,
			enum: PriceCurrency,
			default: PriceCurrency.USD,
		},

		propertyPriceOriginal: {
			type: Number,
		},

		carBrand: {
			type: String,
			enum: CarBrand,
			required: true,
		},

		carModel: {
			type: String,
			required: true,
		},

		carYear: {
			type: Number,
			required: true,
		},

		carMileage: {
			type: Number,
			required: true,
		},

		carFuel: {
			type: String,
			enum: CarFuel,
			required: true,
		},

		carTransmission: {
			type: String,
			enum: CarTransmission,
			required: true,
		},

		carColor: {
			type: String,
		},

		/** engine volume in liters, empty for electric cars **/
		carEngine: {
			type: Number,
		},

		carTrim: {
			type: String,
		},

		/** buyer-trust & import details **/
		carVin: {
			type: String,
		},

		carAccidentHistory: {
			type: String,
			enum: CarAccidentHistory,
		},

		carOwners: {
			type: Number,
		},

		// customs cleared in Uzbekistan ("rastamojka")
		carCustomsCleared: {
			type: Boolean,
		},

		// for cars abroad: days and cost (USD) to deliver to Uzbekistan
		carDeliveryDays: {
			type: Number,
		},

		carDeliveryCost: {
			type: Number,
		},

		propertyViews: {
			type: Number,
			default: 0,
		},

		propertyLikes: {
			type: Number,
			default: 0,
		},

		propertyComments: {
			type: Number,
			default: 0,
		},

		propertyRank: {
			type: Number,
			default: 0,
		},

		propertyImages: {
			type: [String],
			required: true,
		},

		propertyDesc: {
			type: String,
		},

		propertyBarter: {
			type: Boolean,
			default: false,
		},

		propertyNegotiable: {
			type: Boolean,
			default: false,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		soldAt: {
			type: Date,
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'properties' },
);

PropertySchema.index(
	{ memberId: 1, propertyType: 1, propertyLocation: 1, propertyTitle: 1, propertyPrice: 1 },
	{ unique: true },
);

export default PropertySchema;
