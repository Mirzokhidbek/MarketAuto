/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import {
	AdminCodeInput,
	AgentsInquiry,
	EmailSignupInput,
	LoginInput,
	MemberInput,
	MembersInquiry,
	PasswordInput,
} from '../../libs/dto/member/member.input';
import { MemberAdminDetail } from '../../libs/dto/member/member-admin';
import { SuperAdminOnly } from '../auth/decorators/super-admin.decorator';
import { Member, Members } from '../../libs/dto/member/member';
import { BadRequestException, UseGuards, UseInterceptors, Logger } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate, pickSelfEditable } from '../../libs/dto/member/member.update';
import { clientIp, idString, shapeIntoMongoObjectId, uploadTargets, validMimeTypes } from '../../libs/config';
import { limiters } from '../../libs/rate-limiter';
import { StorageService } from '../storage/storage.service';
import {
	ChangeEmailInput,
	ChangePhoneInput,
	CodeLoginInput,
	ResetPasswordInput,
} from '../../libs/dto/verification/verification';
import { MemberSession } from '../../libs/dto/member/session';
import { AuthService } from '../auth/auth.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Message } from '../../libs/enums/common.enum';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import {
	clearRefreshCookie,
	currentRefreshToken,
	isNativeClient,
	readRefreshCookie,
	SessionCookieInterceptor,
} from '../../libs/session-cookie';

const logger = new Logger('MemberResolver');

interface FileUpload {
	filename: string;
	mimetype: string;
	encoding: string;
	createReadStream: () => NodeJS.ReadableStream;
}

@Resolver()
// login, signup, refresh, password reset/change: the refresh token goes into an httpOnly cookie
@UseInterceptors(SessionCookieInterceptor)
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly authService: AuthService,
		private readonly storageService: StorageService,
	) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput, @Context() context: any): Promise<Member> {
		return await this.memberService.signup(input, clientIp(context), context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Member)
	public async signupWithEmail(@Args('input') input: EmailSignupInput, @Context() context: any): Promise<Member> {
		return await this.memberService.signupWithEmail(input, clientIp(context), context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput, @Context() context: any): Promise<Member> {
		return await this.memberService.login(input, clientIp(context), context?.req?.headers?.['user-agent']);
	}

	/**
	 * new access token + rotated refresh cookie for a valid refresh token (the old one is revoked).
	 * The token comes from the httpOnly cookie; the argument is only for sessions started before the cookie existed.
	 */
	@Mutation(() => Member)
	public async refreshSession(
		@Args('refreshToken', { type: () => String, nullable: true }) refreshToken: string | null,
		@Context() context: any,
	): Promise<Member> {
		// a native app never falls back to a cookie, so a web page cannot get a token handed back in the body
		const token = isNativeClient(context?.req)
			? refreshToken || currentRefreshToken(context?.req) || ''
			: refreshToken || readRefreshCookie(context?.req) || '';
		return await this.authService.refreshSession(token, context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Boolean)
	public async logout(
		@Args('refreshToken', { type: () => String, nullable: true }) refreshToken: string | null,
		@Context() context: any,
	): Promise<boolean> {
		const token = refreshToken || currentRefreshToken(context?.req);
		if (token) await this.authService.revokeSession(token);
		clearRefreshCookie(context?.res);
		return true;
	}

	/** the logged-in member's own profile (the access token carries only id, nick, role and avatar) */
	@UseGuards(AuthGuard)
	@Query(() => Member)
	public async getMe(@AuthMember() authMember: Member): Promise<Member> {
		return authMember;
	}

	@Mutation(() => Member)
	public async loginWithCode(@Args('input') input: CodeLoginInput, @Context() context: any): Promise<Member> {
		return await this.memberService.loginWithCode(input, context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Member)
	public async resetPassword(@Args('input') input: ResetPasswordInput, @Context() context: any): Promise<Member> {
		return await this.memberService.resetPassword(input, context?.req?.headers?.['user-agent']);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async changePhone(
		@Args('input') input: ChangePhoneInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		return await this.memberService.changePhone(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async changeEmail(
		@Args('input') input: ChangeEmailInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		return await this.memberService.changeEmail(memberId, input);
	}

	/** devices where this account is logged in */
	@UseGuards(AuthGuard)
	@Query(() => [MemberSession])
	public async getMySessions(@AuthMember('_id') memberId: ObjectId, @Context() context: any): Promise<MemberSession[]> {
		return await this.authService.listSessions(memberId, currentRefreshToken(context?.req));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Boolean)
	public async revokeMySession(
		@Args('sessionId') sessionId: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<boolean> {
		return await this.authService.revokeSessionById(memberId, sessionId);
	}

	/** "log out on all other devices"; returns how many were logged out */
	@UseGuards(AuthGuard)
	@Mutation(() => Int)
	public async logoutOtherSessions(@AuthMember('_id') memberId: ObjectId, @Context() context: any): Promise<number> {
		return await this.authService.revokeOtherSessions(memberId, currentRefreshToken(context?.req));
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
		return `Hi ${memberNick}`;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
	}

	// Authentication
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		// only profile fields; role, admin role, badges, status, phone and password are not editable here
		return await this.memberService.updateMember(memberId, pickSelfEditable(input));
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async changePassword(
		@Args('input') input: PasswordInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		return await this.memberService.changePassword(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Member> {
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(
		@Args('input') input: AgentsInquiry,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Members> {
		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	//** ADMIN **/
	// Authorization: ADMIN
	@Mutation(() => Member)
	public async verifyAdminLogin(@Args('input') input: AdminCodeInput, @Context() context: any): Promise<Member> {
		return await this.memberService.verifyAdminLogin(input, context?.req?.headers?.['user-agent']);
	}

	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Query(() => MemberAdminDetail)
	public async getMemberAdminDetail(@Args('memberId') input: string): Promise<MemberAdminDetail> {
		return await this.memberService.getMemberAdminDetail(shapeIntoMongoObjectId(input));
	}

	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		return await this.memberService.getAllMembersByAdmin(input);
	}

	// Authorization: ADMIN
	@Roles(MemberType.ADMIN)
	@SuperAdminOnly()
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') adminId: ObjectId,
	): Promise<Member> {
		// an admin must not demote or block their own account and lock everyone out of the panel
		if (String(input._id) === String(adminId) && (input.memberType || input.memberStatus))
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		return await this.memberService.updateMemberByAdmin(input, adminId);
	}

	//** UPLOADER **/
	@UseGuards(AuthGuard)
	@Mutation((returns) => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		{ createReadStream, filename, mimetype }: FileUpload,
		@Args('target') target: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<string> {
		if (!filename) throw new BadRequestException(Message.UPLOAD_FAILED);
		if (!validMimeTypes.includes(mimetype)) throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
		if (!uploadTargets.includes(target)) throw new BadRequestException(Message.INVALID_UPLOAD_TARGET);
		await limiters.uploads.consume(idString(memberId));

		// compressed to WebP and stored locally or on S3 (see StorageService)
		const buffer = await this.storageService.readStream(createReadStream());
		return await this.storageService.saveImage(buffer, target, memberId);
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<string[]> {
		if (!uploadTargets.includes(target)) throw new BadRequestException(Message.INVALID_UPLOAD_TARGET);
		// every file counts: one call with 10 photos uses 10 of the hourly allowance
		for (let i = 0; i < files.length; i++) await limiters.uploads.consume(idString(memberId));

		const uploadedImages: string[] = [];
		await Promise.all(
			files.map(async (img: Promise<FileUpload>, index: number) => {
				try {
					const { mimetype, createReadStream } = await img;
					if (!validMimeTypes.includes(mimetype)) throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
					const buffer = await this.storageService.readStream(createReadStream());
					uploadedImages[index] = await this.storageService.saveImage(buffer, target, memberId);
				} catch (err) {
					logger.warn(`Error, image skipped: ${err instanceof Error ? err.message : err}`);
				}
			}),
		);
		// keep the original order, skip files that failed
		return uploadedImages.filter(Boolean);
	}
}
