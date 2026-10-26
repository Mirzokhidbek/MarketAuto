import { Field, Float, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { ExchangeService } from './exchange.service';

@ObjectType()
export class ExchangeRate {
	@Field(() => Float)
	usdToUzs!: number;

	@Field(() => Date)
	updatedAt!: Date;

	/** CBU = Central Bank of Uzbekistan, FALLBACK = DEFAULT_USD_UZS env when the bank is unreachable */
	@Field(() => String)
	source!: string;
}

@Resolver()
export class ExchangeResolver {
	constructor(private readonly exchangeService: ExchangeService) {}

	@Query(() => ExchangeRate)
	public async getExchangeRate(): Promise<ExchangeRate> {
		return await this.exchangeService.getRate();
	}
}
