import { ExchangeService } from './exchange.service';

describe('ExchangeService', () => {
	const realFetch = global.fetch;
	afterEach(() => {
		global.fetch = realFetch;
	});

	it('answers at once with the default rate while the bank is slow', async () => {
		global.fetch = jest.fn(() => new Promise(() => {})) as any; // the bank never answers
		const exchange = new ExchangeService();
		const started = Date.now();
		const rate = await exchange.getRate();
		expect(Date.now() - started).toBeLessThan(100);
		expect(rate.source).toBe('FALLBACK');
		await exchange.getRate();
		expect(global.fetch).toHaveBeenCalledTimes(1); // one bank request at a time
	});

	it('serves the bank rate once it has arrived', async () => {
		global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve([{ Rate: '12650.5' }]) })) as any;
		const exchange = new ExchangeService();
		exchange.onModuleInit();
		await new Promise((resolve) => setImmediate(resolve));
		const rate = await exchange.getRate();
		expect(rate).toMatchObject({ usdToUzs: 12650.5, source: 'CBU' });
		expect(global.fetch).toHaveBeenCalledTimes(1); // the fresh bank rate is reused
	});
});
