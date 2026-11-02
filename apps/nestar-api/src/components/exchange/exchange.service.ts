import { settings } from '../../libs/env';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ExchangeRate } from './exchange.resolver';

const CACHE_MS = 6 * 60 * 60 * 1000;
const FALLBACK_CACHE_MS = 10 * 60 * 1000;

/**
 * Official USD -> UZS rate (Central Bank of Uzbekistan), cached; prices are stored in USD.
 * Requests never wait for the bank: they get the cached (or default) rate while a refresh runs in the background.
 */
@Injectable()
export class ExchangeService implements OnModuleInit {
	private readonly logger = new Logger('ExchangeRate');
	private cache: ExchangeRate | null = null;
	private refreshing: Promise<void> | null = null;

	public onModuleInit(): void {
		void this.refresh();
	}

	public async getRate(): Promise<ExchangeRate> {
		const age = this.cache ? Date.now() - this.cache.updatedAt.getTime() : Infinity;
		// a bank rate is kept 6h; the fallback only 10 min so the bank is retried soon
		if (!this.cache || age >= (this.cache.source === 'CBU' ? CACHE_MS : FALLBACK_CACHE_MS)) void this.refresh();
		return this.cache ?? { usdToUzs: settings.defaultUsdUzs, updatedAt: new Date(), source: 'FALLBACK' };
	}

	/** one bank request at a time; failures keep the last bank rate or fall back to the configured default */
	private refresh(): Promise<void> {
		this.refreshing ??= this.fetchRate().finally(() => (this.refreshing = null));
		return this.refreshing;
	}

	private async fetchRate(): Promise<void> {
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
					: { usdToUzs: settings.defaultUsdUzs, updatedAt: new Date(), source: 'FALLBACK' };
		}
	}

	/** so'm -> USD with today's rate (used for search and sorting of prices entered in so'm) */
	public async uzsToUsd(amount: number): Promise<number> {
		const { usdToUzs } = await this.getRate();
		return Math.round(amount / usdToUzs);
	}
}
