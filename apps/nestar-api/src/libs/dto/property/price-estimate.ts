import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PriceEstimate {
	/** average USD price of similar cars (same brand and model, year ±1) */
	@Field(() => Int)
	average!: number;

	@Field(() => Int)
	count!: number;

	/** LOW | FAIR | HIGH, or UNKNOWN when there are fewer than 3 similar cars */
	@Field(() => String)
	verdict!: string;
}
