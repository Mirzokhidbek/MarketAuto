import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import {
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyStatus,
	PropertyType,
} from '../../enums/property.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class PropertyUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id!: ObjectId;

	@IsOptional()
	@Field(() => PropertyType, { nullable: true })
	propertyType?: PropertyType;

	@IsOptional()
	@Field(() => PropertyStatus, { nullable: true })
	propertyStatus?: PropertyStatus;

	@IsOptional()
	@Field(() => CarCountry, { nullable: true })
	carCountry?: CarCountry;

	@IsOptional()
	@Field(() => PropertyLocation, { nullable: true })
	propertyLocation?: PropertyLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	propertyAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	propertyTitle?: string;

	@IsOptional()
	@Field(() => Number, { nullable: true })
	propertyPrice?: number;

	@IsOptional()
	@Field(() => CarBrand, { nullable: true })
	carBrand?: CarBrand;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carModel?: string;

	@IsOptional()
	@IsInt()
	@Min(1950)
	@Max(2100)
	@Field(() => Int, { nullable: true })
	carYear?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	carMileage?: number;

	@IsOptional()
	@Field(() => CarFuel, { nullable: true })
	carFuel?: CarFuel;

	@IsOptional()
	@Field(() => CarTransmission, { nullable: true })
	carTransmission?: CarTransmission;

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

	@IsOptional()
	@Field(() => [String], { nullable: true })
	propertyImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	propertyRent?: boolean;

	soldAt?: Date;

	deletedAt?: Date;
}
