import { StorageService } from '../storage/storage.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry, PasswordInput } from '../../libs/dto/member/member.input';
import { ChangePhoneInput, CodeLoginInput, ResetPasswordInput } from '../../libs/dto/verification/verification';
import { VerificationService } from '../verification/verification.service';
import { isValidPhone, limiters, normalizePhone } from '../../libs/rate-limiter';
import { Direction, Message } from '../../libs/enums/common.enum';
import { MemberStatus, MemberType, VerificationPurpose } from '../../libs/enums/member.enum';
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
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(input.memberPassword, response.memberPassword!);
		if (!isMatch) {
			limiters.loginIp.hit(ip);
			limiters.loginNick.hit(nickKey);
			throw new InternalServerErrorException(Message.WRONG_PASSWORD);
		}
		limiters.loginNick.reset(nickKey);
		return await this.authService.issueTokens(response, userAgent);
	}

	/** password-less login: SMS code to the account phone */
	public async loginWithCode(input: CodeLoginInput, userAgent?: string): Promise<Member> {
		const memberPhone = await this.verificationService.consumeCode(input.phone, VerificationPurpose.LOGIN, input.code);
		const member = await this.memberModel.findOne({ memberPhone }).exec();
		if (!member || member.memberStatus === MemberStatus.DELETE) throw new BadRequestException(Message.WRONG_CODE);
		if (member.memberStatus === MemberStatus.BLOCK) throw new InternalServerErrorException(Message.BLOCKED_USER);
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

		if (text) match.memberNick = { $regex: searchRegex(text) };
		console.log('match:', match);

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
		if (text) match.memberNick = { $regex: searchRegex(text) };
		console.log('match:', match);

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

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		// admin can reset a password; it must be stored hashed like on signup
		if (input.memberPassword) input.memberPassword = await this.authService.hashPassword(input.memberPassword);
		// a new password, block or delete ends every session of that member
		if (input.memberPassword || (input.memberStatus && input.memberStatus !== MemberStatus.ACTIVE))
			await this.authService.revokeAllSessions(input._id);
		const result: Member | null = await this.memberModel
			.findOneAndUpdate({ _id: input._id }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
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
