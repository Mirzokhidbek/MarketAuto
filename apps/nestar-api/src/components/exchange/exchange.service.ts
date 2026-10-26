import { Injectable, Logger } from '@nestjs/common';
import { ExchangeRate } from './exchange.resolver';

const CACHE_MS = 6 * 60 * 60 * 1000;
const FALLBACK_CACHE_MS = 10 * 60 * 1000;

/** official USD -> UZS rate (Central Bank of Uzbekistan), cached; prices are stored in USD */
@Injectable()
export class ExchangeService {
	private readonly logger = new Logger('ExchangeRate');
	private cache: ExchangeRate | null = null;

	public async getRate(): Promise<ExchangeRate> {
		const age = this.cache ? Date.now() - this.cache.updatedAt.getTime() : Infinity;
		// a bank rate is kept 6h; the fallback only 10 min so the bank is retried without slowing every request
		if (this.cache && age < (this.cache.source === 'CBU' ? CACHE_MS : FALLBACK_CACHE_MS)) return this.cache;
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
		return this.cache;
	}

	/** so'm -> USD with today's rate (used for search and sorting of prices entered in so'm) */
	public async uzsToUsd(amount: number): Promise<number> {
		const { usdToUzs } = await this.getRate();
		return Math.round(amount / usdToUzs);
	}
}
