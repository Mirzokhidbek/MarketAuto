import { Field, Float, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';

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

const CACHE_MS = 6 * 60 * 60 * 1000;

/** official USD -> UZS rate for showing prices in so'm; prices are stored in USD */
@Resolver()
export class ExchangeResolver {
	private readonly logger = new Logger('ExchangeRate');
	private cache: ExchangeRate | null = null;

	@Query(() => ExchangeRate)
	public async getExchangeRate(): Promise<ExchangeRate> {
		const age = this.cache ? Date.now() - this.cache.updatedAt.getTime() : Infinity;
		// a bank rate is kept 6h; the fallback only 10 min so the bank is retried without slowing every request
		if (this.cache && age < (this.cache.source === 'CBU' ? CACHE_MS : 10 * 60 * 1000)) return this.cache;
		try {
			const response = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/', {
				signal: AbortSignal.timeout(5000),
			});
			const [usd] = (await response.json()) as { Rate: string }[];
			const rate = Number(usd?.Rate);
			if (!rate) throw new Error('empty rate');
			this.cache = { usdToUzs: rate, updatedAt: new Date(), source: 'CBU' };
		} catch (err: any) {
			this.logger.warn(`CBU rate unavailable: ${err.message}`);
			// keep the last bank rate if there was one, otherwise the configured default
			this.cache =
				this.cache?.source === 'CBU'
					? { ...this.cache, updatedAt: new Date() }
					: { usdToUzs: Number(process.env.DEFAULT_USD_UZS ?? 12700), updatedAt: new Date(), source: 'FALLBACK' };
		}
		return this.cache!;
	}
}
