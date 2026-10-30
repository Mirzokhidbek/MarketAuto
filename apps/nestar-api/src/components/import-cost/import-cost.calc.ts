import { CarCountry, CarFuel } from '../../libs/enums/property.enum';
import { DutyRow, ImportCostItem, ImportTariff, UtilizationRow } from '../../libs/dto/import-cost/import-cost';

/**
 * Starting tariff until a super admin saves the official one (admin panel → Import tariff).
 * Checked against the press in October 2026:
 * - new cars (< 1 year) up to 1000 / 1200 cm³: 15% + $0.40 / $0.60 per cm³ since 1 Jan 2026 (gazeta.uz, daryo.uz, uzdaily.uz)
 * - VAT 12%; electric cars: 0% duty, utilization fee 120 BHM (≤ 3 years) / 210 BHM (older) since May 2025 (kun.uz)
 * The other rows (larger engines, older cars, excise, combustion utilization fee, delivery, clearance) are estimates
 * from secondary sources and must be confirmed with the customs committee or a broker.
 */
export const DEFAULT_TARIFF: ImportTariff = {
	vatPercent: 12,
	electricDutyPercent: 0,
	baseAmountUzs: 412000,
	clearanceUsd: 300,
	defaultEngineCc: 2000,
	duty: [
		{ maxAgeYears: 0, maxEngineCc: 1000, percent: 15, usdPerCc: 0.4, excisePercent: 0 },
		{ maxAgeYears: 0, maxEngineCc: 1200, percent: 15, usdPerCc: 0.6, excisePercent: 0 },
		{ maxAgeYears: 0, maxEngineCc: null, percent: 15, usdPerCc: 1, excisePercent: 0 },
		{ maxAgeYears: 3, maxEngineCc: null, percent: 30, usdPerCc: 1, excisePercent: 0 },
		{ maxAgeYears: null, maxEngineCc: null, percent: 40, usdPerCc: 3, excisePercent: 0 },
	],
	utilization: [
		{ group: 'ELECTRIC', maxAgeYears: 3, maxEngineCc: null, baseAmounts: 120 },
		{ group: 'ELECTRIC', maxAgeYears: null, maxEngineCc: null, baseAmounts: 210 },
		{ group: 'COMBUSTION', maxAgeYears: 3, maxEngineCc: 1000, baseAmounts: 15 },
		{ group: 'COMBUSTION', maxAgeYears: 3, maxEngineCc: 2000, baseAmounts: 25 },
		{ group: 'COMBUSTION', maxAgeYears: 3, maxEngineCc: 3000, baseAmounts: 35 },
		{ group: 'COMBUSTION', maxAgeYears: 3, maxEngineCc: null, baseAmounts: 60 },
		{ group: 'COMBUSTION', maxAgeYears: null, maxEngineCc: 1000, baseAmounts: 60 },
		{ group: 'COMBUSTION', maxAgeYears: null, maxEngineCc: 2000, baseAmounts: 120 },
		{ group: 'COMBUSTION', maxAgeYears: null, maxEngineCc: 3000, baseAmounts: 240 },
		{ group: 'COMBUSTION', maxAgeYears: null, maxEngineCc: null, baseAmounts: 480 },
	],
	shipping: [
		{ country: CarCountry.SOUTH_KOREA, costUsd: 2500, days: 35 },
		{ country: CarCountry.CHINA, costUsd: 1500, days: 20 },
		{ country: CarCountry.JAPAN, costUsd: 3000, days: 45 },
		{ country: CarCountry.USA, costUsd: 3500, days: 60 },
		{ country: CarCountry.GERMANY, costUsd: 2800, days: 30 },
		{ country: CarCountry.UAE, costUsd: 2000, days: 25 },
		{ country: CarCountry.OTHER, costUsd: 3000, days: 45 },
	],
	updatedAt: null,
};

/** an age older than this is flagged: older cars pay the highest rates and may need an import permit */
export const OLD_CAR_YEARS = 3;

export interface CarFacts {
	propertyPrice: number;
	carCountry: CarCountry;
	carYear: number;
	carFuel: CarFuel;
	carEngine?: number | null;
	carDeliveryCost?: number | null;
	carDeliveryDays?: number | null;
}

export interface CostBreakdown {
	ageYears: number;
	engineCc: number | null;
	customsValueUsd: number;
	items: ImportCostItem[];
	extraUsd: number;
	extraPercent: number;
	totalUsd: number;
	deliveryDays: number | null;
	warnings: string[];
}

const fits = (row: { maxAgeYears?: number | null; maxEngineCc?: number | null }, age: number, cc: number) =>
	(row.maxAgeYears == null || age <= row.maxAgeYears) && (row.maxEngineCc == null || cc <= row.maxEngineCc);

const round = (value: number) => Math.round(value * 100) / 100;
const fmt = (value: number) => String(round(value));

/**
 * What a car abroad costs once it is registered in Uzbekistan, in USD:
 * customs value = price + delivery; duty and excise on the customs value; VAT on value + duty + excise;
 * utilization fee in BHM converted with today's rate; plus clearance. Pure, so it is unit tested.
 */
export function calculateImportCost(
	car: CarFacts,
	tariff: ImportTariff,
	usdToUzs: number,
	now = new Date(),
): CostBreakdown {
	const warnings: string[] = [];
	const ageYears = Math.max(0, now.getFullYear() - car.carYear);
	const electric = car.carFuel === CarFuel.ELECTRIC;
	if (car.carFuel === CarFuel.HYBRID) warnings.push('HYBRID_AS_FUEL');
	if (ageYears > OLD_CAR_YEARS) warnings.push('OLD_CAR');

	let engineCc: number | null = null;
	if (!electric) {
		engineCc = car.carEngine ? Math.round(car.carEngine * 1000) : tariff.defaultEngineCc;
		if (!car.carEngine) warnings.push('ENGINE_ASSUMED');
	}

	const shippingRow = tariff.shipping.find((row) => row.country === car.carCountry);
	const sellerShipping = car.carDeliveryCost && car.carDeliveryCost > 0 ? car.carDeliveryCost : null;
	const shipping = sellerShipping ?? shippingRow?.costUsd ?? 0;
	if (!sellerShipping) warnings.push('SHIPPING_DEFAULT');
	const deliveryDays = car.carDeliveryDays || shippingRow?.days || null;

	const customsValue = car.propertyPrice + shipping;
	const items: ImportCostItem[] = [
		{ key: 'SHIPPING', amountUsd: round(shipping), basis: sellerShipping ? 'SELLER' : 'TARIFF' },
	];

	if (electric) {
		items.push({
			key: 'DUTY',
			amountUsd: round((customsValue * tariff.electricDutyPercent) / 100),
			basis: `${fmt(tariff.electricDutyPercent)}%`,
		});
		items.push({ key: 'EXCISE', amountUsd: 0, basis: '0%' });
	} else {
		const row: DutyRow | undefined = tariff.duty.find((r) => fits(r, ageYears, engineCc as number));
		const percent = row?.percent ?? 0;
		const perCc = row?.usdPerCc ?? 0;
		items.push({
			key: 'DUTY',
			amountUsd: round((customsValue * percent) / 100 + perCc * (engineCc as number)),
			basis: perCc ? `${fmt(percent)}% + $${fmt(perCc)}/cm³` : `${fmt(percent)}%`,
		});
		const excise = row?.excisePercent ?? 0;
		items.push({ key: 'EXCISE', amountUsd: round((customsValue * excise) / 100), basis: `${fmt(excise)}%` });
	}

	const dutyAndExcise = items
		.filter((i) => i.key === 'DUTY' || i.key === 'EXCISE')
		.reduce((s, i) => s + i.amountUsd, 0);
	items.push({
		key: 'VAT',
		amountUsd: round(((customsValue + dutyAndExcise) * tariff.vatPercent) / 100),
		basis: `${fmt(tariff.vatPercent)}%`,
	});

	const group = electric ? 'ELECTRIC' : 'COMBUSTION';
	const util: UtilizationRow | undefined = tariff.utilization.find(
		(r) => r.group === group && fits(r, ageYears, engineCc ?? 0),
	);
	const baseAmounts = util?.baseAmounts ?? 0;
	items.push({
		key: 'UTILIZATION',
		amountUsd: round((baseAmounts * tariff.baseAmountUzs) / usdToUzs),
		basis: `${fmt(baseAmounts)} BHM`,
	});
	items.push({ key: 'CLEARANCE', amountUsd: round(tariff.clearanceUsd), basis: 'FIXED' });

	const extraUsd = round(items.reduce((sum, item) => sum + item.amountUsd, 0));
	return {
		ageYears,
		engineCc,
		customsValueUsd: round(customsValue),
		items,
		extraUsd,
		extraPercent: car.propertyPrice ? round((extraUsd / car.propertyPrice) * 100) : 0,
		totalUsd: round(car.propertyPrice + extraUsd),
		deliveryDays,
		warnings,
	};
}

/** checks a tariff before it is saved; returns the first problem or null */
export function tariffProblem(t: ImportTariff): string | null {
	const num = (v: unknown, max = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
	const optInt = (v: unknown) => v === null || v === undefined || (Number.isInteger(v) && (v as number) >= 0);
	if (!num(t.vatPercent, 100) || !num(t.electricDutyPercent, 100)) return 'percent must be 0-100';
	if (!num(t.baseAmountUzs) || t.baseAmountUzs <= 0 || !num(t.clearanceUsd)) return 'amounts must be positive';
	if (!Number.isInteger(t.defaultEngineCc) || t.defaultEngineCc < 600 || t.defaultEngineCc > 10000)
		return 'default engine must be 600-10000 cm³';
	if (!t.duty.length || !t.utilization.length) return 'duty and utilization need at least one row';
	if (t.duty.length > 30 || t.utilization.length > 30 || t.shipping.length > 20) return 'too many rows';
	for (const r of t.duty) {
		if (!optInt(r.maxAgeYears) || !optInt(r.maxEngineCc)) return 'age and engine limits must be whole numbers';
		if (!num(r.percent, 100) || !num(r.excisePercent, 100) || !num(r.usdPerCc, 100)) return 'bad duty row';
	}
	for (const r of t.utilization) {
		if (!['ELECTRIC', 'COMBUSTION'].includes(r.group)) return 'group must be ELECTRIC or COMBUSTION';
		if (!optInt(r.maxAgeYears) || !optInt(r.maxEngineCc) || !num(r.baseAmounts, 10000)) return 'bad utilization row';
	}
	const countries = new Set<string>();
	for (const r of t.shipping) {
		if (!Object.values(CarCountry).includes(r.country) || countries.has(r.country)) return 'bad or repeated country';
		countries.add(r.country);
		if (!num(r.costUsd, 100000) || !Number.isInteger(r.days) || r.days < 0 || r.days > 365) return 'bad shipping row';
	}
	return null;
}
