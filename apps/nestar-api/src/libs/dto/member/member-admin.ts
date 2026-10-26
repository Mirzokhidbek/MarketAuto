import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Member } from './member';

@ObjectType()
export class MemberAdminDetail {
	@Field(() => Member)
	member!: Member;

	@Field(() => Int)
	carsActive!: number;

	@Field(() => Int)
	carsPending!: number;

	@Field(() => Int)
	carsRejected!: number;

	@Field(() => Int)
	carsSold!: number;

	@Field(() => Int)
	carsDeleted!: number;

	/** complaints about this member's listings */
	@Field(() => Int)
	reportsAgainst!: number;

	@Field(() => Int)
	reportsMade!: number;

	@Field(() => Int)
	reviewsReceived!: number;

	@Field(() => Int)
	conversations!: number;

	@Field(() => Int)
	activeSessions!: number;
}
