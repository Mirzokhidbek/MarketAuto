import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminLogs, AdminLogsInquiry } from '../../libs/dto/admin-log/admin-log';
import { T } from '../../libs/types/common';

@Injectable()
export class AdminLogService {
	private readonly logger = new Logger('AdminLog');

	constructor(@InjectModel('AdminLog') private readonly adminLogModel: Model<any>) {}

	/** never throws: logging must not break the admin action itself */
	public async log(adminId: any, action: string, targetType: string, targetId?: any, details?: string): Promise<void> {
		try {
			await this.adminLogModel.create({
				adminId,
				action,
				targetType,
				targetId: targetId ? String(targetId) : undefined,
				details: details?.slice(0, 500),
			});
		} catch (err: any) {
			this.logger.error(`could not write admin log: ${err.message}`);
		}
	}

	public async getLogs(input: AdminLogsInquiry): Promise<AdminLogs> {
		const match: T = {};
		if (input.targetType) match.targetType = input.targetType;
		if (input.targetId) match.targetId = input.targetId;
		const [result] = await this.adminLogModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{ $lookup: { from: 'members', localField: 'adminId', foreignField: '_id', as: 'adminData' } },
							{ $unwind: { path: '$adminData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result as AdminLogs;
	}

	public isObjectId(value: string): boolean {
		return Types.ObjectId.isValid(value);
	}
}
