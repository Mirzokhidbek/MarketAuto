import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min, Matches, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import {
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyStatus,
	PropertyType,
	CarAccidentHistory,
	PriceCurrency,
} from '../../enums/property.enum';
import { Direction } from '../../enums/common.enum';
import { availableOptions, availablePropertySorts } from '../../config';
import type { ObjectId } from 'mongoose';

@InputType()
export class PropertyInput {
	@IsNotEmpty()
	@Field(() => PropertyType)
	propertyType!: PropertyType;

	@IsNotEmpty()
	@Field(() => CarCountry)
	carCountry!: CarCountry;

	@IsOptional()
	@Field(() => PropertyLocation, { nullable: true })
	propertyLocation?: PropertyLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	propertyAddress!: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	propertyTitle!: string;

	@IsNotEmpty()
	@Field(() => Number)
	propertyPrice!: number;

	@IsNotEmpty()
	@Field(() => CarBrand)
	carBrand!: CarBrand;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carModel!: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1950)
	@Max(2100)
	@Field(() => Int)
	carYear!: number;

	@IsNotEmpty()
	@IsInt()
	@Min(0)
	@Field(() => Int)
	carMileage!: number;

	@IsNotEmpty()
	@Field(() => CarFuel)
	carFuel!: CarFuel;

	@IsNotEmpty()
	@Field(() => CarTransmission)
	carTransmission!: CarTransmission;

	@IsOptional()
	@Length(2, 30)
	@Field(() => String, { nullable: true })
	carColor?: string;

	@IsOptional()
	@Min(0.5)
	@Max(10)
	@Field(() => Number, { nullable: true })
	carEngine?: number;

	@IsOptional()
	@Length(1, 30)
	@Field(() => String, { nullable: true })
	carTrim?: string;

	// buyers skip listings with one photo: front, back, interior at least
	@IsNotEmpty()
	@ArrayMinSize(3, { message: 'Please add at least 3 photos' })
	@ArrayMaxSize(10)
	@Field(() => [String])
	propertyImages!: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyBarter?: boolean;

	@IsOptional()
	@Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, { message: 'VIN must be 17 letters/digits (no I, O, Q)' })
	@Field(() => String, { nullable: true })
	carVin?: string;

	@IsOptional()
	@Field(() => CarAccidentHistory, { nullable: true })
	carAccidentHistory?: CarAccidentHistory;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(20)
	@Field(() => Int, { nullable: true })
	carOwners?: number;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carCustomsCleared?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(365)
	@Field(() => Int, { nullable: true })
	carDeliveryDays?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(100000)
	@Field(() => Int, { nullable: true })
	carDeliveryCost?: number;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyNegotiable?: boolean;

	/** currency of propertyPrice as typed by the seller; UZS is converted to USD on the server */
	@IsOptional()
	@Field(() => PriceCurrency, { nullable: true })
	propertyPriceCurrency?: PriceCurrency;

	propertyPriceOriginal?: number;

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start!: number;

	@Field(() => Int)
	end!: number;
}

@InputType()
export class YearsRange {
	@Field(() => Int)
	start!: number;

	@Field(() => Int)
	end!: number;
}

@InputType()
export class MileageRange {
	@Field(() => Int)
	start!: number;

	@Field(() => Int)
	end!: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start!: Date;

	@Field(() => Date)
	end!: Date;
}

@InputType()
class PISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [CarCountry], { nullable: true })
	countryList?: CarCountry[];

	@IsOptional()
	@Field(() => [PropertyLocation], { nullable: true })
	locationList?: PropertyLocation[];

	@IsOptional()
	@Field(() => [PropertyType], { nullable: true })
	typeList?: PropertyType[];

	@IsOptional()
	@Field(() => [CarBrand], { nullable: true })
	brandList?: CarBrand[];

	@IsOptional()
	@Field(() => [CarFuel], { nullable: true })
	fuelList?: CarFuel[];

	@IsOptional()
	@Field(() => [CarTransmission], { nullable: true })
	transmissionList?: CarTransmission[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	options?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => YearsRange, { nullable: true })
	yearsRange?: YearsRange;

	@IsOptional()
	@Field(() => MileageRange, { nullable: true })
	mileageRange?: MileageRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Length(1, 40)
	@Field(() => String, { nullable: true })
	model?: string;

	// only cars that were never in an accident
	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	noAccident?: boolean;
}

@InputType()
export class PropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search!: PISearch;
}

@InputType()
class APISearch {
	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;
}

@InputType()
export class AgentPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => APISearch)
	search!: APISearch;
}

@InputType()
class ALPISearch {
	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;

	@IsOptional()
	@Field(() => [PropertyLocation], { nullable: true })
	propertyLocationList?: PropertyLocation[];

	@IsOptional()
	@Field(() => [CarCountry], { nullable: true })
	countryList?: CarCountry[];

	@IsOptional()
	@Field(() => [CarBrand], { nullable: true })
	brandList?: CarBrand[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: string;
}

@InputType()
export class AllPropertiesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availablePropertySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search!: ALPISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;
}
