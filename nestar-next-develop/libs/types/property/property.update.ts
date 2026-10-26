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

export interface PropertyUpdate {
	_id: string;
	propertyType?: PropertyType;
	propertyStatus?: PropertyStatus;
	propertyRejectReason?: string;
	carCountry?: CarCountry;
	propertyLocation?: PropertyLocation;
	propertyAddress?: string;
	propertyTitle?: string;
	propertyPrice?: number;
	carBrand?: CarBrand;
	carModel?: string;
	carYear?: number;
	carMileage?: number;
	carFuel?: CarFuel;
	carTransmission?: CarTransmission;
	carColor?: string;
	carEngine?: number;
	carTrim?: string;
	propertyImages?: string[];
	propertyDesc?: string;
	propertyBarter?: boolean;
	propertyNegotiable?: boolean;
	propertyPriceCurrency?: 'USD' | 'UZS';
	propertyPriceOriginal?: number;
	carVin?: string;
	carAccidentHistory?: CarAccidentHistory;
	carOwners?: number;
	carCustomsCleared?: boolean;
	carDeliveryDays?: number;
	carDeliveryCost?: number;
	soldAt?: Date;
	deletedAt?: Date;
}
