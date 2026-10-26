import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AdminCodeInput, AgentsInquiry, LoginInput, MemberInput, MembersInquiry, PasswordInput } from '../../libs/dto/member/member.input';
import { ChangePhoneInput, CodeLoginInput, ResetPasswordInput } from '../../libs/dto/verification/verification';
import { VerificationService } from '../verification/verification.service';
import { isValidPhone, limiters, normalizePhone } from '../../libs/rate-limiter';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AdminRole, MemberStatus, MemberType, VerificationPurpose } from '../../libs/enums/member.enum';
import { AdminLogService } from '../admin-log/admin-log.service';
import { MemberAdminDetail } from '../../libs/dto/member/member-admin';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { lookupAuthMemberLiked, searchRegex } from '../../libs/config';

/** "You have been blocked!" + the admin's reason; the client translates the fixed first part */
const blockedMessage = (member: { memberBlockReason?: string | null }): string =>
	member.memberBlockReason ? `${Message.BLOCKED_USER} ${member.memberBlockReason}` : Message.BLOCKED_USER;

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private authService: AuthService,
		private viewService: ViewService,
		private likeService: LikeService,
		private notificationService: NotificationService,
		private verificationService: VerificationService,
		private storageService: StorageService,
		private adminLogService: AdminLogService,
	) {}

	public async signup(input: MemberInput, ip: string, userAgent?: string): Promise<Member> {
		if (input.memberType === MemberType.ADMIN) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		limiters.signupIp.consume(ip);
		// the phone must be confirmed with the SMS code before the account exists
		const memberPhone = await this.verificationService.consumeCode(
			input.memberPhone,
			VerificationPurpose.SIGNUP,
			input.verificationCode,
		);
		const { verificationCode, ...data } = input;
		const memberPassword = await this.authService.hashPassword(input.memberPassword);
		try {
			const result = await this.memberModel.create({ ...data, memberPhone, memberPassword, memberPhoneVerified: true });
			return await this.authService.issueTokens(result, userAgent);
		} catch (err) {
			console.log('Error on Service.model:', err instanceof Error ? err.message : String(err));
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async login(input: LoginInput, ip: string, userAgent?: string): Promise<Member> {
		const { memberNick } = input;
		const nickKey = memberNick.toLowerCase();
		// brute-force protection: limited wrong passwords per nickname and per IP
		limiters.loginIp.assert(ip);
		limiters.loginNick.assert(nickKey);

		// the login field takes a nickname or a phone number ("+998 90 123 45 67")
		const phone = normalizePhone(memberNick);
		const byPhone = /^[+\d\s()-]+$/.test(memberNick.trim()) && isValidPhone(phone);
		const response: Member | null = await this.memberModel
			.findOne(byPhone ? { memberPhone: phone } : { memberNick: memberNick })
			.select('+memberPassword')
			.exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			limiters.loginIp.hit(ip);
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword!);
		if (!isMatch) {
			limiters.loginIp.hit(ip);
			limiters.loginNick.hit(nickKey);
			throw new InternalServerErrorException(Message.WRONG_PASSWORD);
		}
		limiters.loginNick.reset(nickKey);
		// checked after the password, so the block reason is shown only to the account owner
		if (response.memberStatus === MemberStatus.BLOCK) throw new InternalServerErrorException(blockedMessage(response));

		// admins: the password is only the first step, an SMS code to the admin phone is the second
		if (response.memberType === MemberType.ADMIN && process.env.ADMIN_2FA !== 'off') {
			const sent = await this.verificationService.requestCode(response.memberPhone, VerificationPurpose.ADMIN_2FA, ip);
			return { memberNick: response.memberNick, twoFactorRequired: true, devCode: sent.devCode } as Member;
		}
		return await this.authService.issueTokens(response, userAgent);
	}

	/** second step of an admin login */
	public async verifyAdminLogin(input: AdminCodeInput, userAgent?: string): Promise<Member> {
		const member = await this.memberModel.findOne({ memberNick: input.memberNick, memberType: MemberType.ADMIN }).exec();
		if (!member || member.memberStatus !== MemberStatus.ACTIVE) throw new BadRequestException(Message.WRONG_CODE);
		await this.verificationService.consumeCode(member.memberPhone, VerificationPurpose.ADMIN_2FA, input.code);
		return await this.authService.issueTokens(member, userAgent);
	}

	/** password-less login: SMS code to the account phone */
	public async loginWithCode(input: CodeLoginInput, userAgent?: string): Promise<Member> {
		const memberPhone = await this.verificationService.consumeCode(input.phone, VerificationPurpose.LOGIN, input.code);
		const member = await this.memberModel.findOne({ memberPhone }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETE) throw new BadRequestException(Message.WRONG_CODE);
		if (member.memberStatus === MemberStatus.BLOCK) throw new InternalServerErrorException(blockedMessage(member));
		// an SMS alone is not enough for an admin account
		if (member.memberType === MemberType.ADMIN) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		return await this.authService.issueTokens(member, userAgent);
	}

	/** "forgot password": SMS code to the account phone, then a new password; all old sessions end */
	public async resetPassword(input: ResetPasswordInput, userAgent?: string): Promise<Member> {
		const memberPhone = await this.verificationService.consumeCode(
			input.phone,
			VerificationPurpose.RESET_PASSWORD,
			input.code,
		);
		const memberPassword = await this.authService.hashPassword(input.newPassword);
		const member = await this.memberModel
			.findOneAndUpdate({ memberPhone, memberStatus: MemberStatus.ACTIVE }, { memberPassword }, { new: true })
			.exec();
		if (!member) throw new BadRequestException(Message.WRONG_CODE);
		await this.authService.revokeAllSessions(member._id);
		return await this.authService.issueTokens(member, userAgent);
	}

	/** a new phone number is accepted only with the SMS code sent to that number */
	public async changePhone(memberId: ObjectId, input: ChangePhoneInput): Promise<Member> {
		const memberPhone = await this.verificationService.consumeCode(input.phone, VerificationPurpose.CHANGE_PHONE, input.code);
		try {
			const result = await this.memberModel
				.findOneAndUpdate(
					{ _id: memberId, memberStatus: MemberStatus.ACTIVE },
					{ memberPhone, memberPhoneVerified: true },
					{ new: true },
				)
				.exec();
			if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err: any) {
			if (err instanceof InternalServerErrorException) throw err;
			throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		}
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const previous = await this.memberModel.findById(memberId).select('memberImage').lean().exec();
		const result: Member | null = await this.memberModel
			.findOneAndUpdate(
				{
					_id: memberId,
					memberStatus: MemberStatus.ACTIVE,
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		// the replaced avatar file is no longer needed
		if (input.memberImage && previous?.memberImage && previous.memberImage !== input.memberImage)
			await this.storageService.removeImage(previous.memberImage);

		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async changePassword(memberId: ObjectId, input: PasswordInput): Promise<Member> {
		const member: Member | null = await this.memberModel
			.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
			.select('+memberPassword')
			.exec();
		if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const isMatch = await this.authService.comparePasswords(input.currentPassword, member.memberPassword!);
		if (!isMatch) throw new BadRequestException(Message.WRONG_CURRENT_PASSWORD);

		const memberPassword = await this.authService.hashPassword(input.newPassword);
		const result = await this.memberModel.findByIdAndUpdate(memberId, { memberPassword }, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		// other devices are logged out; this one gets a fresh session
		await this.authService.revokeAllSessions(memberId);
		return await this.authService.issueTokens(result);
	}

	public async getMember(memberId: ObjectId | null, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: {
				$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
			},
		};
		const targetMember = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER };
			const newView = await this.viewService.recordView(viewInput);
			if (newView) {
				await this.memberModel.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true }).exec();
				targetMember.memberViews++;
			}

			// meliked
			const likeInput = { memberId: memberId, likeRefId: targetId, likeGroup: LikeGroup.MEMBER };
			targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

			//meFollowed
			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId: followingId, followerId: followerId }).exec();
		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}

	public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
		const { text } = input.search;
		// sellers: dealers plus any member who has posted a car
		const match: T = {
			memberStatus: MemberStatus.ACTIVE,
			$or: [{ memberType: MemberType.AGENT }, { memberType: MemberType.USER, memberProperties: { $gt: 0 } }],
		};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		// admins search by nickname, name or phone ("90 123 45 67" finds 998901234567)
		if (text) {
			const digits = text.replace(/\D/g, '');
			match.$or = [{ memberNick: { $regex: searchRegex(text) } }, { memberFullName: { $regex: searchRegex(text) } }];
			if (digits.length >= 4) match.$or.push({ memberPhone: { $regex: searchRegex(digits) } });
		}

		const result = (await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit }, //
							{ $limit: input.limit },
							// meLiked
							lookupAuthMemberLiked(memberId),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec()) as Members[];
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		if (String(memberId) === String(likeRefId)) throw new BadRequestException(Message.SELF_LIKE_DENIED);
		const target: Member | null = await this.memberModel
			.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		// LIKE TOGGLE via Like modules
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });
		if (modifier > 0) {
			await this.notificationService.notify({
				notificationType: NotificationType.LIKE,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: target.memberNick,
				authorId: memberId,
				receiverId: likeRefId,
			});
		}

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) {
			// nick, name or (4+ digits) part of the phone number
			const or: T[] = [{ memberNick: { $regex: searchRegex(text) } }, { memberFullName: { $regex: searchRegex(text) } }];
			const digits = text.replace(/\D/g, '');
			if (digits.length >= 4) or.push({ memberPhone: { $regex: digits } });
			match.$or = or;
		}

		const result = (await this.memberModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec()) as Members[];

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateMemberByAdmin(input: MemberUpdate, adminId?: ObjectId): Promise<Member> {
		const before = await this.memberModel.findById(input._id).lean().exec();
		if (!before) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		// admin can reset a password; it must be stored hashed like on signup
		if (input.memberPassword) input.memberPassword = await this.authService.hashPassword(input.memberPassword);
		// block reason is kept only while the member is blocked
		if (input.memberStatus && input.memberStatus !== MemberStatus.BLOCK) (input as T).memberBlockReason = null;
		// an admin role only makes sense for admins
		const becomesAdmin = (input.memberType ?? before.memberType) === MemberType.ADMIN;
		if (!becomesAdmin) (input as T).memberAdminRole = null;
		else if (input.memberType === MemberType.ADMIN && !input.memberAdminRole && !before.memberAdminRole)
			input.memberAdminRole = AdminRole.MODERATOR;
		// a new password, block or delete ends every session of that member
		if (input.memberPassword || (input.memberStatus && input.memberStatus !== MemberStatus.ACTIVE))
			await this.authService.revokeAllSessions(input._id);
		const result: Member | null = await this.memberModel
			.findOneAndUpdate({ _id: input._id }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		// audit: one entry per kind of change
		const changes: [string, string | undefined][] = [];
		if (input.memberStatus && input.memberStatus !== before.memberStatus)
			changes.push([`MEMBER_${input.memberStatus}`, input.memberBlockReason]);
		if (input.memberType && input.memberType !== before.memberType) changes.push(['MEMBER_TYPE', `${before.memberType} -> ${input.memberType}`]);
		if (input.memberAdminRole && input.memberAdminRole !== before.memberAdminRole) changes.push(['MEMBER_ADMIN_ROLE', input.memberAdminRole]);
		if (input.memberPassword) changes.push(['MEMBER_PASSWORD_RESET', undefined]);
		if (input.memberTrusted !== undefined && input.memberTrusted !== before.memberTrusted) changes.push(['MEMBER_TRUSTED', String(input.memberTrusted)]);
		if (input.memberDealerVerified !== undefined && input.memberDealerVerified !== before.memberDealerVerified)
			changes.push(['MEMBER_DEALER_VERIFIED', String(input.memberDealerVerified)]);
		for (const [action, details] of changes)
			await this.adminLogService.log(adminId, action, 'MEMBER', result._id, `${result.memberNick}${details ? ': ' + details : ''}`);
		return result;
	}

	/** everything an admin needs about one member on a single screen */
	public async getMemberAdminDetail(memberId: ObjectId): Promise<MemberAdminDetail> {
		const member = await this.memberModel.findById(memberId).lean().exec();
		if (!member) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const db = this.memberModel.db;
		const cars = await db.collection('properties').aggregate([{ $match: { memberId: member._id } }, { $group: { _id: '$propertyStatus', count: { $sum: 1 } } }]).toArray();
		const carIds = (await db.collection('properties').find({ memberId: member._id }, { projection: { _id: 1 } }).toArray()).map((car: any) => car._id);
		const count = (status: string) => cars.find((row: any) => row._id === status)?.count ?? 0;
		return {
			member: member as Member,
			carsActive: count('ACTIVE'),
			carsPending: count('PENDING'),
			carsRejected: count('REJECTED'),
			carsSold: count('SOLD'),
			carsDeleted: count('DELETE'),
			reportsAgainst: await db.collection('reports').countDocuments({ propertyId: { $in: carIds } }),
			reportsMade: await db.collection('reports').countDocuments({ memberId: member._id }),
			reviewsReceived: await db.collection('comments').countDocuments({ commentRefId: member._id, commentStatus: 'ACTIVE' }),
			conversations: await db.collection('conversations').countDocuments({ participants: member._id }),
			activeSessions: await db.collection('sessions').countDocuments({ memberId: member._id, expiresAt: { $gt: new Date() } }),
		};
	}

	public async isTrusted(memberId: ObjectId): Promise<boolean> {
		const member = await this.memberModel.findById(memberId).select('memberTrusted memberType').lean().exec();
		return !!member?.memberTrusted;
	}

	/** after the first approved listing the seller publishes without moderation */
	public async markTrusted(memberId: ObjectId): Promise<void> {
		await this.memberModel.updateOne({ _id: memberId }, { memberTrusted: true }).exec();
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		const { _id, targetKey, modifier } = input;
		const result: Member | null = await this.memberModel
			.findByIdAndUpdate(
				{ _id: _id }, // filter
				{ $inc: { [targetKey]: modifier } },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}
}
