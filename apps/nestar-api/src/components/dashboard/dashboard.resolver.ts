import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardStats } from '../../libs/dto/dashboard/dashboard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { PropertyStatus } from '../../libs/enums/property.enum';
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
	) {}

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
		]);

		return {
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
		};
	}
}
