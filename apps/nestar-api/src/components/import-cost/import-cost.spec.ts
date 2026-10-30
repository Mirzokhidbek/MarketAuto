import { Types } from 'mongoose';
import { calculateImportCost, DEFAULT_TARIFF, tariffProblem } from './import-cost.calc';
import { ImportCostService } from './import-cost.service';
import { CarCountry, CarFuel, PropertyStatus } from '../../libs/enums/property.enum';

const NOW = new Date('2026-10-30T12:00:00Z');
const RATE = 12500;
const amount = (cost: { items: { key: string; amountUsd: number }[] }, key: string) =>
	cost.items.find((item) => item.key === key)?.amountUsd;

describe('calculateImportCost', () => {
	it('new 1.0 L petrol car from Korea: 15% + $0.4/cm³, VAT on value + duty, BHM fee in USD', () => {
		const cost = calculateImportCost(
			{
				propertyPrice: 10000,
				carCountry: CarCountry.SOUTH_KOREA,
				carYear: 2026,
				carFuel: CarFuel.PETROL,
				carEngine: 1,
			},
			DEFAULT_TARIFF,
			RATE,
			NOW,
		);
		expect(cost.customsValueUsd).toBe(12500); // price + default Korea delivery 2500
		expect(amount(cost, 'DUTY')).toBe(2275); // 12500 * 15% + 1000 * 0.4
		expect(amount(cost, 'VAT')).toBe(1773); // (12500 + 2275) * 12%
		expect(amount(cost, 'UTILIZATION')).toBe(494.4); // 15 BHM * 412 000 / 12 500
		expect(cost.extraUsd).toBe(7342.4);
		expect(cost.totalUsd).toBe(17342.4);
		expect(cost.warnings).toEqual(['SHIPPING_DEFAULT']);
	});

	it('electric car pays no duty; older than 3 years pays the higher fee and is flagged', () => {
		const cost = calculateImportCost(
			{
				propertyPrice: 20000,
				carCountry: CarCountry.CHINA,
				carYear: 2021,
				carFuel: CarFuel.ELECTRIC,
				carDeliveryCost: 1000,
			},
			DEFAULT_TARIFF,
			RATE,
			NOW,
		);
		expect(cost.engineCc).toBeNull();
		expect(amount(cost, 'DUTY')).toBe(0);
		expect(amount(cost, 'VAT')).toBe(2520); // 21000 * 12%
		expect(amount(cost, 'UTILIZATION')).toBe(6921.6); // 210 BHM
		expect(cost.items[0].basis).toBe('SELLER');
		expect(cost.warnings).toEqual(['OLD_CAR']);
	});

	it('hybrid without engine volume uses the default engine and says so', () => {
		const cost = calculateImportCost(
			{ propertyPrice: 15000, carCountry: CarCountry.JAPAN, carYear: 2024, carFuel: CarFuel.HYBRID },
			DEFAULT_TARIFF,
			RATE,
			NOW,
		);
		expect(cost.engineCc).toBe(2000);
		expect(cost.items.find((i) => i.key === 'DUTY')?.basis).toBe('30% + $1/cm³'); // 1-3 years row
		expect(cost.warnings).toEqual(expect.arrayContaining(['HYBRID_AS_FUEL', 'ENGINE_ASSUMED', 'SHIPPING_DEFAULT']));
	});
});

describe('tariffProblem', () => {
	it('accepts the default tariff and rejects broken ones', () => {
		expect(tariffProblem(DEFAULT_TARIFF)).toBeNull();
		expect(tariffProblem({ ...DEFAULT_TARIFF, vatPercent: 150 })).toMatch(/percent/);
		expect(tariffProblem({ ...DEFAULT_TARIFF, duty: [] })).toMatch(/row/);
		expect(
			tariffProblem({ ...DEFAULT_TARIFF, shipping: [...DEFAULT_TARIFF.shipping, DEFAULT_TARIFF.shipping[0]] }),
		).toMatch(/repeated/);
		expect(
			tariffProblem({ ...DEFAULT_TARIFF, utilization: [{ group: 'DIESEL', baseAmounts: 1, maxAgeYears: null }] }),
		).toMatch(/group/);
	});
});

describe('ImportCostService', () => {
	const setup = (car: any, local: any[] = [], tariffRow: any = null) => {
		const propertyModel = {
			findById: jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve(car) }) })),
			aggregate: jest.fn(() => ({ exec: () => Promise.resolve(local) })),
		};
		const settingModel = {
			findOne: jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve(tariffRow) }) })),
			updateOne: jest.fn(() => ({ exec: () => Promise.resolve({}) })),
		};
		const exchange = { getRate: jest.fn(() => Promise.resolve({ usdToUzs: RATE, source: 'CBU', updatedAt: NOW })) };
		const adminLog = { log: jest.fn() };
		const service = new ImportCostService(propertyModel as any, settingModel as any, exchange as any, adminLog as any);
		return { service, settingModel, adminLog };
	};
	const korean = {
		_id: new Types.ObjectId(),
		propertyStatus: PropertyStatus.ACTIVE,
		propertyPrice: 10000,
		carCountry: CarCountry.SOUTH_KOREA,
		carYear: new Date().getFullYear(),
		carFuel: CarFuel.PETROL,
		carEngine: 1,
		carBrand: 'KIA',
		carModel: 'Picanto',
	};

	it('a car already in Uzbekistan needs no import', async () => {
		const { service } = setup({ ...korean, carCountry: CarCountry.UZBEKISTAN });
		const cost = await service.getImportCost(korean._id as any);
		expect(cost.applicable).toBe(false);
		expect(cost.reason).toBe('IN_UZBEKISTAN');
		expect(cost.totalUzs).toBe(10000 * RATE);
	});

	it('compares the landed cost with the same cars sold in Uzbekistan', async () => {
		const { service } = setup(korean, [{ average: 20000, count: 4 }]);
		const cost = await service.getImportCost(korean._id as any);
		expect(cost.applicable).toBe(true);
		expect(cost.comparison).toEqual({
			localAverageUsd: 20000,
			localCount: 4,
			differenceUsd: -2658,
			verdict: 'CHEAPER',
		});
	});

	it('uses the saved tariff and refuses to save a broken one', async () => {
		const saved = { value: JSON.stringify({ ...DEFAULT_TARIFF, clearanceUsd: 0 }), updatedAt: NOW };
		const { service, settingModel, adminLog } = setup(korean, [], saved);
		expect((await service.getTariff()).clearanceUsd).toBe(0);
		await expect(service.updateTariff(korean._id as any, { ...DEFAULT_TARIFF, vatPercent: -1 })).rejects.toThrow();
		expect(settingModel.updateOne).not.toHaveBeenCalled();
		await service.updateTariff(korean._id as any, DEFAULT_TARIFF);
		expect(settingModel.updateOne).toHaveBeenCalledTimes(1);
		expect(adminLog.log).toHaveBeenCalledWith(
			korean._id,
			'IMPORT_TARIFF_UPDATE',
			'SETTINGS',
			undefined,
			'import tariff',
		);
	});
});
