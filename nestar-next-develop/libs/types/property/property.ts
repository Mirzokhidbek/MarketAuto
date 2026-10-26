import {
	CarAccidentHistory,
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyStatus,
	PropertyType,
} from '../../enums/property.enum';
import { Member } from '../member/member';

export interface MeLiked {
	memberId: string;
	likeRefId: string;
	myFavorite: boolean;
}

export interface TotalCounter {
	total: number;
}

export interface Property {
	_id: string;
	propertyType: PropertyType;
	propertyStatus: PropertyStatus;
	carCountry: CarCountry;
	propertyLocation?: PropertyLocation;
	propertyAddress: string;
	propertyTitle: string;
	propertyPrice: number;
	carBrand: CarBrand;
	carModel: string;
	carYear: number;
	carMileage: number;
	carFuel: CarFuel;
	carTransmission: CarTransmission;
	carColor?: string;
	carEngine?: number;
	carTrim?: string;
	propertyViews: number;
	propertyLikes: number;
	propertyComments: number;
	propertyRank: number;
	propertyImages: string[];
	propertyDesc?: string;
	propertyBarter: boolean;
	propertyNegotiable?: boolean;
	propertyPriceCurrency?: 'USD' | 'UZS';
	propertyPriceOriginal?: number;
	carVin?: string;
	carAccidentHistory?: CarAccidentHistory;
	carOwners?: number;
	carCustomsCleared?: boolean;
	carDeliveryDays?: number;
	carDeliveryCost?: number;
	memberId: string;
	soldAt?: Date;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member;
}

export interface Properties {
	list: Property[];
	metaCounter: TotalCounter[];
}
