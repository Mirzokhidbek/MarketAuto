import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { ImportComparison, ImportCost, ImportTariff, ImportTariffInput } from '../../libs/dto/import-cost/import-cost';
import { Message } from '../../libs/enums/common.enum';
import { CarCountry, PropertyStatus } from '../../libs/enums/property.enum';
import { searchRegex } from '../../libs/config';
import { ExchangeService } from '../exchange/exchange.service';
import { AdminLogService } from '../admin-log/admin-log.service';
import { calculateImportCost, DEFAULT_TARIFF, tariffProblem } from './import-cost.calc';

const TARIFF_KEY = 'importTariff';
/** the local market verdict needs this many cars already in Uzbekistan */
const MIN_LOCAL = 2;
/** landed cost within ±5% of the local average reads as "about the same" */
const SIMILAR_BAND = 0.05;

/**
 * "What will this car cost in Uzbekistan?" Every request uses the current listing price, today's Central Bank
 * rate and the tariff as saved now, so a new rate, a tariff change or a price edit shows on the next refresh.
 */
@Injectable()
export class ImportCostService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('Setting') private readonly settingModel: Model<any>,
		private readonly exchangeService: ExchangeService,
		private readonly adminLogService: AdminLogService,
	) {}

	public async getTariff(): Promise<ImportTariff> {
		const row = await this.settingModel.findOne({ key: TARIFF_KEY }).lean<{ value: string; updatedAt: Date }>().exec();
		if (!row?.value) return DEFAULT_TARIFF;
		try {
			return { ...DEFAULT_TARIFF, ...(JSON.parse(row.value) as Partial<ImportTariff>), updatedAt: row.updatedAt };
		} catch {
			return DEFAULT_TARIFF;
		}
	}

	public async updateTariff(adminId: ObjectId, input: ImportTariffInput): Promise<ImportTariff> {
		const tariff: ImportTariff = {
			vatPercent: input.vatPercent,
			electricDutyPercent: input.electricDutyPercent,
			baseAmountUzs: input.baseAmountUzs,
			clearanceUsd: input.clearanceUsd,
			defaultEngineCc: input.defaultEngineCc,
			// keep only the known fields of each row (GraphQL already typed them)
			duty: input.duty.map(({ maxAgeYears, maxEngineCc, percent, usdPerCc, excisePercent }) => ({
				maxAgeYears: maxAgeYears ?? null,
				maxEngineCc: maxEngineCc ?? null,
				percent,
				usdPerCc,
				excisePercent,
			})),
			utilization: input.utilization.map(({ group, maxAgeYears, maxEngineCc, baseAmounts }) => ({
				group,
				maxAgeYears: maxAgeYears ?? null,
				maxEngineCc: maxEngineCc ?? null,
				baseAmounts,
			})),
			shipping: input.shipping.map(({ country, costUsd, days }) => ({ country, costUsd, days })),
		};
		const problem = tariffProblem(tariff);
		if (problem) throw new BadRequestException(`${Message.BAD_REQUEST}: ${problem}`);
		await this.settingModel
			.updateOne({ key: TARIFF_KEY }, { key: TARIFF_KEY, value: JSON.stringify(tariff) }, { upsert: true })
			.exec();
		await this.adminLogService.log(adminId, 'IMPORT_TARIFF_UPDATE', 'SETTINGS', undefined, 'import tariff');
		return await this.getTariff();
	}

	public async getImportCost(propertyId: ObjectId): Promise<ImportCost> {
		const car = await this.propertyModel.findById(propertyId).lean().exec();
		if (!car || car.propertyStatus === PropertyStatus.DELETE) throw new NotFoundException(Message.NO_DATA_FOUND);
		const [tariff, rate] = await Promise.all([this.getTariff(), this.exchangeService.getRate()]);
		const base = {
			carPriceUsd: car.propertyPrice,
			usdToUzs: rate.usdToUzs,
			rateSource: rate.source,
			rateUpdatedAt: rate.updatedAt,
			tariffUpdatedAt: tariff.updatedAt ?? null,
			calculatedAt: new Date(),
		};

		const reason =
			car.carCountry === CarCountry.UZBEKISTAN ? 'IN_UZBEKISTAN' : car.carCustomsCleared ? 'CUSTOMS_CLEARED' : null;
		if (reason) {
			return {
				...base,
				applicable: false,
				reason,
				ageYears: Math.max(0, new Date().getFullYear() - car.carYear),
				engineCc: car.carEngine ? Math.round(car.carEngine * 1000) : null,
				customsValueUsd: 0,
				items: [],
				extraUsd: 0,
				extraPercent: 0,
				totalUsd: car.propertyPrice,
				totalUzs: Math.round(car.propertyPrice * rate.usdToUzs),
				deliveryDays: null,
				warnings: [],
				comparison: null,
			};
		}

		const cost = calculateImportCost(car, tariff, rate.usdToUzs);
		if (rate.source !== 'CBU') cost.warnings.push('RATE_FALLBACK');
		return {
			...base,
			...cost,
			applicable: true,
			reason: null,
			totalUzs: Math.round(cost.totalUsd * rate.usdToUzs),
			comparison: await this.compareWithLocal(car, cost.totalUsd),
		};
	}

	/** same brand and model, year ±1, already in Uzbekistan or customs cleared, on sale or sold */
	private async compareWithLocal(car: Property, totalUsd: number): Promise<ImportComparison | null> {
		const [stats] = await this.propertyModel
			.aggregate([
				{
					$match: {
						_id: { $ne: car._id },
						carBrand: car.carBrand,
						carModel: { $regex: searchRegex(car.carModel) },
						carYear: { $gte: car.carYear - 1, $lte: car.carYear + 1 },
						propertyStatus: { $in: [PropertyStatus.ACTIVE, PropertyStatus.SOLD] },
						$or: [{ carCountry: CarCountry.UZBEKISTAN }, { carCustomsCleared: true }],
					},
				},
				{ $group: { _id: null, average: { $avg: '$propertyPrice' }, count: { $sum: 1 } } },
			])
			.exec();
		if (!stats || stats.count < MIN_LOCAL) return null;
		const localAverageUsd = Math.round(stats.average);
		const differenceUsd = Math.round(totalUsd - localAverageUsd);
		const ratio = differenceUsd / localAverageUsd;
		const verdict = ratio < -SIMILAR_BAND ? 'CHEAPER' : ratio > SIMILAR_BAND ? 'MORE_EXPENSIVE' : 'SIMILAR';
		return { localAverageUsd, localCount: stats.count, differenceUsd, verdict };
	}
}
