import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ObjectId } from 'mongoose';
import { SiteSettings, SiteSettingsInput } from '../../libs/dto/setting/setting';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuperAdminOnly } from '../auth/decorators/super-admin.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { AdminLogService } from '../admin-log/admin-log.service';

const KEYS = ['supportPhone', 'supportEmail', 'telegramUrl', 'instagramUrl', 'facebookUrl'] as const;

/** contacts and social links editable from the admin panel (public read) */
@Resolver()
export class SettingResolver {
	constructor(
		@InjectModel('Setting') private readonly settingModel: Model<any>,
		private readonly adminLogService: AdminLogService,
	) {}

	@Query(() => SiteSettings)
	public async getSiteSettings(): Promise<SiteSettings> {
		const rows = await this.settingModel
			.find({ key: { $in: KEYS } })
			.lean()
			.exec();
		return Object.fromEntries(rows.map((row: { key: string; value: unknown }) => [row.key, row.value]));
	}

	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Mutation(() => SiteSettings)
	public async updateSiteSettings(
		@Args('input') input: SiteSettingsInput,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<SiteSettings> {
		for (const key of KEYS) {
			const value = input[key];
			if (value === undefined) continue;
			// links must be real web addresses (no javascript: etc.)
			if (key.endsWith('Url') && value && !/^https:\/\/[^\s]+$/i.test(value))
				throw new BadRequestException(Message.BAD_REQUEST);
			await this.settingModel.updateOne({ key }, { key, value: value.trim() }, { upsert: true }).exec();
		}
		await this.adminLogService.log(adminId, 'SETTINGS_UPDATE', 'SETTINGS', undefined, JSON.stringify(input));
		return await this.getSiteSettings();
	}
}
