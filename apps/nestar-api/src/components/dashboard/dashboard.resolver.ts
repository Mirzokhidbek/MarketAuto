import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyStat, DashboardStats } from '../../libs/dto/dashboard/dashboard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { PropertyStatus, ReportStatus } from '../../libs/enums/property.enum';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { NoticeCategory, NoticeStatus } from '../../libs/enums/notice.enum';

/** numbers for the admin dashboard, counted in one round trip */
@Resolver()
export class DashboardResolver {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<any>,
		@InjectModel('Property') private readonly propertyModel: Model<any>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
		@InjectModel('Notice') private readonly noticeModel: Model<any>,
		@InjectModel('Report') private readonly reportModel: Model<any>,
	) {}

	/** new members and new listings per day, oldest first, days without activity included */
	private async daily(days: number): Promise<DailyStat[]> {
		const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
		since.setHours(0, 0, 0, 0);
		const perDay = async (model: Model<any>, match: Record<string, any>) => {
			const rows = await model
				.aggregate([
					{ $match: { ...match, createdAt: { $gte: since } } },
					{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Tashkent' } }, count: { $sum: 1 } } },
				])
				.exec();
			return new Map(rows.map((row: any) => [row._id, row.count]));
		};
		const members = await perDay(this.memberModel, { memberType: { $ne: MemberType.ADMIN } });
		const cars = await perDay(this.propertyModel, {});
		return Array.from({ length: days }, (_, index) => {
			const day = new Date(since.getTime() + index * 24 * 60 * 60 * 1000);
			const date = day.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tashkent' });
			return { date, members: (members.get(date) as number) ?? 0, cars: (cars.get(date) as number) ?? 0 };
		});
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => DashboardStats)
	public async getDashboardStats(): Promise<DashboardStats> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const members = { memberType: { $ne: MemberType.ADMIN } };

		const [
			membersTotal,
			membersBlocked,
			dealers,
			membersToday,
			carsActive,
			carsSold,
			carsDeleted,
			carsToday,
			articlesActive,
			inquiriesWaiting,
			carsPending,
			reportsOpen,
		] = await Promise.all([
			this.memberModel.countDocuments({ ...members, memberStatus: { $ne: MemberStatus.DELETE } }),
			this.memberModel.countDocuments({ ...members, memberStatus: MemberStatus.BLOCK }),
			this.memberModel.countDocuments({ memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE }),
			this.memberModel.countDocuments({ ...members, createdAt: { $gte: today } }),
			this.propertyModel.countDocuments({ propertyStatus: PropertyStatus.ACTIVE }),
			this.propertyModel.countDocuments({ propertyStatus: PropertyStatus.SOLD }),
			this.propertyModel.countDocuments({ propertyStatus: PropertyStatus.DELETE }),
			this.propertyModel.countDocuments({ createdAt: { $gte: today } }),
			this.boardArticleModel.countDocuments({ articleStatus: BoardArticleStatus.ACTIVE }),
			this.noticeModel.countDocuments({ noticeCategory: NoticeCategory.INQUIRY, noticeStatus: NoticeStatus.HOLD }),
			this.propertyModel.countDocuments({ propertyStatus: PropertyStatus.PENDING }),
			this.reportModel.countDocuments({ reportStatus: ReportStatus.OPEN }),
		]);

		return {
			daily: await this.daily(14),
			membersTotal,
			membersBlocked,
			dealers,
			membersToday,
			carsActive,
			carsSold,
			carsDeleted,
			carsToday,
			articlesActive,
			inquiriesWaiting,
			carsPending,
			reportsOpen,
		};
	}
}
