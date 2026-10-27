import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DailyStat {
	/** YYYY-MM-DD (Tashkent time) */
	@Field(() => String)
	date!: string;

	@Field(() => Int)
	members!: number;

	@Field(() => Int)
	cars!: number;
}

/** seller with the most cars for sale */
@ObjectType()
export class TopSeller {
	@Field(() => String)
	memberId!: string;

	@Field(() => String)
	memberNick!: string;

	@Field(() => String, { nullable: true })
	memberImage?: string;

	@Field(() => String)
	memberType!: string;

	@Field(() => Int)
	cars!: number;

	@Field(() => Int)
	views!: number;

	@Field(() => Int)
	likes!: number;
}

@ObjectType()
export class DashboardStats {
	@Field(() => [TopSeller])
	topSellers!: TopSeller[];

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

	@Field(() => Int)
	carsPending!: number;

	@Field(() => Int)
	reportsOpen!: number;

	@Field(() => [DailyStat])
	daily!: DailyStat[];
}
