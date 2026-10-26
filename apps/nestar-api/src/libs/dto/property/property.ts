import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
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
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class Property {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => PropertyType)
	propertyType!: PropertyType;

	@Field(() => PropertyStatus)
	propertyStatus!: PropertyStatus;

	@Field(() => CarCountry)
	carCountry!: CarCountry;

	@Field(() => PropertyLocation, { nullable: true })
	propertyLocation?: PropertyLocation;

	@Field(() => String)
	propertyAddress!: string;

	@Field(() => String)
	propertyTitle!: string;

	@Field(() => Number)
	propertyPrice!: number;

	@Field(() => CarBrand)
	carBrand!: CarBrand;

	@Field(() => String)
	carModel!: string;

	@Field(() => Int)
	carYear!: number;

	@Field(() => Int)
	carMileage!: number;

	@Field(() => CarFuel)
	carFuel!: CarFuel;

	@Field(() => CarTransmission)
	carTransmission!: CarTransmission;

	@Field(() => String, { nullable: true })
	carColor?: string;

	@Field(() => Number, { nullable: true })
	carEngine?: number;

	@Field(() => String, { nullable: true })
	carTrim?: string;

	@Field(() => Int)
	propertyViews!: number;

	@Field(() => Int)
	propertyLikes!: number;

	@Field(() => Int)
	propertyComments!: number;

	@Field(() => Int)
	propertyRank!: number;

	@Field(() => [String])
	propertyImages!: string[];

	@Field(() => String, { nullable: true })
	propertyDesc?: string;

	@Field(() => Boolean)
	propertyBarter!: boolean;

	@Field(() => Boolean, { nullable: true })
	propertyNegotiable?: boolean;

	@Field(() => String, { nullable: true })
	carVin?: string;

	@Field(() => CarAccidentHistory, { nullable: true })
	carAccidentHistory?: CarAccidentHistory;

	@Field(() => Int, { nullable: true })
	carOwners?: number;

	@Field(() => Boolean, { nullable: true })
	carCustomsCleared?: boolean;

	@Field(() => Int, { nullable: true })
	carDeliveryDays?: number;

	@Field(() => Int, { nullable: true })
	carDeliveryCost?: number;

	@Field(() => String)
	memberId!: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	/** from aggregation **/

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Properties {
	@Field(() => [Property])
	list!: Property[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}
