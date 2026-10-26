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
import { Direction } from '../../enums/common.enum';

export interface PropertyInput {
	propertyType: PropertyType;
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
	propertyImages: string[];
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
	memberId?: string;
}

interface PISearch {
	model?: string;
	noAccident?: boolean;
	memberId?: string;
	countryList?: CarCountry[];
	locationList?: PropertyLocation[];
	typeList?: PropertyType[];
	brandList?: CarBrand[];
	fuelList?: CarFuel[];
	transmissionList?: CarTransmission[];
	options?: string[];
	pricesRange?: Range;
	periodsRange?: PeriodsRange;
	yearsRange?: Range;
	mileageRange?: Range;
	text?: string;
}

export interface PropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: PISearch;
}

interface APISearch {
	propertyStatus?: PropertyStatus;
}

export interface AgentPropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: APISearch;
}

interface ALPISearch {
	propertyStatus?: PropertyStatus;
	propertyLocationList?: PropertyLocation[];
	countryList?: CarCountry[];
	brandList?: CarBrand[];
	text?: string;
}

export interface AllPropertiesInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ALPISearch;
}

interface Range {
	start: number;
	end: number;
}

interface PeriodsRange {
	start: Date | number;
	end: Date | number;
}
