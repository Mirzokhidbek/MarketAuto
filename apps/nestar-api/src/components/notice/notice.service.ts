import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { InquiryInput, NoticeInput, NoticesInquiry, NoticeUpdate } from '../../libs/dto/notice/notice.input';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notice.enum';
import { Message } from '../../libs/enums/common.enum';
import { searchRegex, lookupMemberForAdmin } from '../../libs/config';
import { T } from '../../libs/types/common';

const logger = new Logger('NoticeService');

@Injectable()
export class NoticeService {
	constructor(@InjectModel('Notice') private readonly noticeModel: Model<Notice>) {}

	/** public FAQ / notices / terms: only published ones, inquiries are private */
	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, text } = input.search;
		if (noticeCategory === NoticeCategory.INQUIRY) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		const match: T = {
			noticeStatus: NoticeStatus.ACTIVE,
			noticeCategory: noticeCategory ?? { $ne: NoticeCategory.INQUIRY },
		};
		if (text) match.noticeTitle = { $regex: searchRegex(text) };
		return await this.findNotices(match, input, false);
	}

	public async createInquiry(memberId: ObjectId, input: InquiryInput): Promise<Notice> {
		// a new inquiry waits (HOLD) until an admin answers it
		return await this.noticeModel.create({
			...input,
			noticeCategory: NoticeCategory.INQUIRY,
			noticeStatus: NoticeStatus.HOLD,
			memberId,
		});
	}

	public async getMyInquiries(memberId: ObjectId, input: NoticesInquiry): Promise<Notices> {
		const match: T = {
			memberId,
			noticeCategory: NoticeCategory.INQUIRY,
			noticeStatus: { $ne: NoticeStatus.DELETE },
		};
		return await this.findNotices(match, input, false);
	}

	/** ADMIN **/

	public async getAllNoticesByAdmin(input: NoticesInquiry): Promise<Notices> {
		const { noticeCategory, noticeStatus, text } = input.search;
		const match: T = {};
		if (noticeCategory) match.noticeCategory = noticeCategory;
		if (noticeStatus) match.noticeStatus = noticeStatus;
		if (text) match.noticeTitle = { $regex: searchRegex(text) };
		return await this.findNotices(match, input, true);
	}

	public async createNotice(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			return await this.noticeModel.create({ ...input, memberId });
		} catch (err: any) {
			logger.warn(`Error, Service.model: ${err.message}`);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const current = await this.noticeModel.findById(input._id).lean().exec();
		if (!current) throw new BadRequestException(Message.UPDATE_FAILED);
		// answering an inquiry marks it as resolved
		if (input.noticeAnswer && current.noticeCategory === NoticeCategory.INQUIRY && !input.noticeStatus)
			input.noticeStatus = NoticeStatus.ACTIVE;

		const result = await this.noticeModel.findByIdAndUpdate(input._id, input, { new: true }).exec();
		if (!result) throw new BadRequestException(Message.UPDATE_FAILED);
		return result;
	}

	public async removeNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel.findByIdAndDelete(noticeId).exec();
		if (!result) throw new BadRequestException(Message.REMOVE_FAILED);
		return result;
	}

	private async findNotices(match: T, input: NoticesInquiry, withMember: boolean): Promise<Notices> {
		const list: any[] = [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }];
		if (withMember) list.push(lookupMemberForAdmin, { $unwind: { path: '$memberData', preserveNullAndEmptyArrays: true } });

		const [result] = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: { createdAt: -1 } },
				{ $facet: { list, metaCounter: [{ $count: 'total' }] } },
			])
			.exec();
		return result as Notices;
	}
}
