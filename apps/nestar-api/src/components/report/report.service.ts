import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Report, ReportInput, Reports, ReportsInquiry, ResolveReportInput } from '../../libs/dto/report/report';
import { PropertyStatus, ReportStatus } from '../../libs/enums/property.enum';
import { Message } from '../../libs/enums/common.enum';
import { shapeIntoMongoObjectId, lookupMemberForAdmin, idString } from '../../libs/config';
import { limiters } from '../../libs/rate-limiter';
import { PropertyService } from '../property/property.service';
import { T } from '../../libs/types/common';

@Injectable()
export class ReportService {
	constructor(
		@InjectModel('Report') private readonly reportModel: Model<Report>,
		@InjectModel('Property') private readonly propertyModel: Model<any>,
		private readonly propertyService: PropertyService,
	) {}

	public async reportProperty(memberId: ObjectId, input: ReportInput): Promise<Report> {
		await limiters.reports.consume(idString(memberId));
		const propertyId = shapeIntoMongoObjectId(input.propertyId);
		const property = await this.propertyModel.findById(propertyId).select('memberId').lean().exec();
		if (!property) throw new NotFoundException(Message.NO_DATA_FOUND);
		if (idString(property.memberId) === idString(memberId)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		try {
			return await this.reportModel.create({ ...input, propertyId, memberId });
		} catch (err) {
			throw new BadRequestException(Message.ALREADY_REPORTED);
		}
	}

	public async getReportsByAdmin(input: ReportsInquiry): Promise<Reports> {
		const match: T = input.reportStatus ? { reportStatus: input.reportStatus } : {};
		const [result] = await this.reportModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMemberForAdmin,
							{ $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } },
							{ $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'propertyData' } },
							{ $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result as Reports;
	}

	public async resolveReport(input: ResolveReportInput): Promise<Report> {
		const report = await this.reportModel.findById(shapeIntoMongoObjectId(input.reportId)).exec();
		if (!report) throw new NotFoundException(Message.NO_DATA_FOUND);

		if (input.action === 'REMOVE_LISTING') {
			await this.propertyService
				.updatePropertyByAdmin({ _id: report.propertyId, propertyStatus: PropertyStatus.DELETE } as any)
				.catch(() => undefined); // already deleted
			await this.reportModel
				.updateMany({ propertyId: report.propertyId }, { reportStatus: ReportStatus.RESOLVED })
				.exec();
		} else {
			report.reportStatus = ReportStatus.RESOLVED;
			await report.save();
		}
		return (await this.reportModel.findById(report._id).exec()) as Report;
	}
}
