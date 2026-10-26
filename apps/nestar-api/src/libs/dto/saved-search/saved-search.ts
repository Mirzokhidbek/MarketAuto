import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';

@ObjectType()
export class SavedSearch {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => String)
	title!: string;

	/** JSON of PropertiesInquiry.search, ready to open the car search page with */
	@Field(() => String)
	search!: string;

	@Field(() => Date, { nullable: true })
	lastNotifiedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;
}

@InputType()
export class SavedSearchInput {
	@IsNotEmpty()
	@Length(2, 80)
	@Field(() => String)
	title!: string;

	@IsNotEmpty()
	@Length(2, 3000)
	@Field(() => String)
	search!: string;
}
