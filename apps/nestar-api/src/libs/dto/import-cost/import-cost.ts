import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CarCountry } from '../../enums/property.enum';

/* ---------- tariff: the rules the estimate uses, edited by a super admin ---------- */

/** customs duty (+ excise) for petrol, diesel, gas and hybrid cars; the first row that fits age and engine wins */
@ObjectType()
@InputType('DutyRowInput')
export class DutyRow {
	/** the row applies to cars up to this age in full years (0 = less than a year old); empty = any age */
	@Field(() => Int, { nullable: true })
	maxAgeYears?: number | null;

	/** engine volume up to this many cm³; empty = any volume */
	@Field(() => Int, { nullable: true })
	maxEngineCc?: number | null;

	/** % of the customs value */
	@Field(() => Float)
	percent!: number;

	/** plus this many USD per cm³ */
	@Field(() => Float)
	usdPerCc!: number;

	/** excise, % of the customs value */
	@Field(() => Float)
	excisePercent!: number;
}

/** utilization (recycling) fee in base amounts (BHM); the first row that fits wins */
@ObjectType()
@InputType('UtilizationRowInput')
export class UtilizationRow {
	/** ELECTRIC for electric cars, COMBUSTION for every other fuel */
	@Field(() => String)
	group!: string;

	@Field(() => Int, { nullable: true })
	maxAgeYears?: number | null;

	@Field(() => Int, { nullable: true })
	maxEngineCc?: number | null;

	@Field(() => Float)
	baseAmounts!: number;
}

/** delivery to Uzbekistan when the seller did not give a cost */
@ObjectType()
@InputType('ShippingRowInput')
export class ShippingRow {
	@Field(() => CarCountry)
	country!: CarCountry;

	@Field(() => Float)
	costUsd!: number;

	@Field(() => Int)
	days!: number;
}

@ObjectType()
export class ImportTariff {
	/** VAT, % of customs value + duty + excise */
	@Field(() => Float)
	vatPercent!: number;

	/** customs duty of electric cars, % of the customs value */
	@Field(() => Float)
	electricDutyPercent!: number;

	/** base calculation amount (BHM) in so'm, the unit of the utilization fee */
	@Field(() => Float)
	baseAmountUzs!: number;

	/** customs clearance, broker, certificate and registration, USD */
	@Field(() => Float)
	clearanceUsd!: number;

	/** engine volume assumed when a petrol/diesel listing has none, cm³ */
	@Field(() => Int)
	defaultEngineCc!: number;

	@Field(() => [DutyRow])
	duty!: DutyRow[];

	@Field(() => [UtilizationRow])
	utilization!: UtilizationRow[];

	@Field(() => [ShippingRow])
	shipping!: ShippingRow[];

	@Field(() => Date, { nullable: true })
	updatedAt?: Date | null;
}

@InputType()
export class ImportTariffInput {
	@Field(() => Float)
	vatPercent!: number;

	@Field(() => Float)
	electricDutyPercent!: number;

	@Field(() => Float)
	baseAmountUzs!: number;

	@Field(() => Float)
	clearanceUsd!: number;

	@Field(() => Int)
	defaultEngineCc!: number;

	@Field(() => [DutyRow])
	duty!: DutyRow[];

	@Field(() => [UtilizationRow])
	utilization!: UtilizationRow[];

	@Field(() => [ShippingRow])
	shipping!: ShippingRow[];
}

/* ---------- result shown on the car page ---------- */

@ObjectType()
export class ImportCostItem {
	/** SHIPPING | DUTY | EXCISE | VAT | UTILIZATION | CLEARANCE */
	@Field(() => String)
	key!: string;

	@Field(() => Float)
	amountUsd!: number;

	/** how it was counted, e.g. "15% + $0.4/cm³" or "120 BHM" */
	@Field(() => String)
	basis!: string;
}

/** landed cost against cars of the same brand/model (year ±1) that are already in Uzbekistan */
@ObjectType()
export class ImportComparison {
	@Field(() => Int)
	localAverageUsd!: number;

	@Field(() => Int)
	localCount!: number;

	/** landed cost minus the local average: below zero = importing is cheaper */
	@Field(() => Int)
	differenceUsd!: number;

	/** CHEAPER | SIMILAR | MORE_EXPENSIVE */
	@Field(() => String)
	verdict!: string;
}

@ObjectType()
export class ImportCost {
	/** false when the car is already in Uzbekistan or customs cleared */
	@Field(() => Boolean)
	applicable!: boolean;

	/** IN_UZBEKISTAN | CUSTOMS_CLEARED when not applicable */
	@Field(() => String, { nullable: true })
	reason?: string | null;

	@Field(() => Float)
	carPriceUsd!: number;

	@Field(() => Int)
	ageYears!: number;

	@Field(() => Int, { nullable: true })
	engineCc?: number | null;

	@Field(() => Float)
	customsValueUsd!: number;

	@Field(() => [ImportCostItem])
	items!: ImportCostItem[];

	/** everything on top of the car price */
	@Field(() => Float)
	extraUsd!: number;

	/** extraUsd as % of the car price */
	@Field(() => Float)
	extraPercent!: number;

	/** car price + everything: what the car costs registered in Uzbekistan */
	@Field(() => Float)
	totalUsd!: number;

	@Field(() => Float)
	totalUzs!: number;

	@Field(() => Int, { nullable: true })
	deliveryDays?: number | null;

	/** ENGINE_ASSUMED | SHIPPING_DEFAULT | OLD_CAR | RATE_FALLBACK | HYBRID_AS_FUEL */
	@Field(() => [String])
	warnings!: string[];

	@Field(() => ImportComparison, { nullable: true })
	comparison?: ImportComparison | null;

	@Field(() => Float)
	usdToUzs!: number;

	@Field(() => String)
	rateSource!: string;

	@Field(() => Date)
	rateUpdatedAt!: Date;

	@Field(() => Date, { nullable: true })
	tariffUpdatedAt?: Date | null;

	@Field(() => Date)
	calculatedAt!: Date;
}
