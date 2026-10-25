import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
	@Field(() => Int)
	membersTotal!: number;

	@Field(() => Int)
	membersBlocked!: number;

	@Field(() => Int)
	dealers!: number;

	@Field(() => Int)
	membersToday!: number;

	@Field(() => Int)
	carsActive!: number;

	@Field(() => Int)
	carsSold!: number;

	@Field(() => Int)
	carsDeleted!: number;

	@Field(() => Int)
	carsToday!: number;

	@Field(() => Int)
	articlesActive!: number;

	@Field(() => Int)
	inquiriesWaiting!: number;
}
