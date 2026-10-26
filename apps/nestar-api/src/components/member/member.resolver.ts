/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { AdminCodeInput, AgentsInquiry, LoginInput, MemberInput, MembersInquiry, PasswordInput } from '../../libs/dto/member/member.input';
import { MemberAdminDetail } from '../../libs/dto/member/member-admin';
import { SuperAdminOnly } from '../auth/decorators/super-admin.decorator';
import { Member, Members } from '../../libs/dto/member/member';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { clientIp, shapeIntoMongoObjectId, uploadTargets, validMimeTypes } from '../../libs/config';
import { StorageService } from '../storage/storage.service';
import { ChangePhoneInput, CodeLoginInput, ResetPasswordInput } from '../../libs/dto/verification/verification';
import { AuthService } from '../auth/auth.service';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Message } from '../../libs/enums/common.enum';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

interface FileUpload {
	filename: string;
	mimetype: string;
	encoding: string;
	createReadStream: () => NodeJS.ReadableStream;
}

@Resolver()
export class MemberResolver {
	constructor(
		private readonly memberService: MemberService,
		private readonly authService: AuthService,
		private readonly storageService: StorageService,
	) {}

	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput, @Context() context: any): Promise<Member> {
		console.log('Mutation: signup');
		return await this.memberService.signup(input, clientIp(context), context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput, @Context() context: any): Promise<Member> {
		console.log('Mutation: login');
		return await this.memberService.login(input, clientIp(context), context?.req?.headers?.['user-agent']);
	}

	/** new access + refresh token pair for a valid refresh token (the old refresh token is revoked) */
	@Mutation(() => Member)
	public async refreshSession(@Args('refreshToken') refreshToken: string, @Context() context: any): Promise<Member> {
		return await this.authService.refreshSession(refreshToken, context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Boolean)
	public async logout(@Args('refreshToken') refreshToken: string): Promise<boolean> {
		await this.authService.revokeSession(refreshToken);
		return true;
	}

	@Mutation(() => Member)
	public async loginWithCode(@Args('input') input: CodeLoginInput, @Context() context: any): Promise<Member> {
		console.log('Mutation: loginWithCode');
		return await this.memberService.loginWithCode(input, context?.req?.headers?.['user-agent']);
	}

	@Mutation(() => Member)
	public async resetPassword(@Args('input') input: ResetPasswordInput, @Context() context: any): Promise<Member> {
		console.log('Mutation: resetPassword');
		return await this.memberService.resetPassword(input, context?.req?.headers?.['user-agent']);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async changePhone(@Args('input') input: ChangePhoneInput, @AuthMember('_id') memberId: ObjectId): Promise<Member> {
		console.log('Mutation: changePhone');
		return await this.memberService.changePhone(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
		console.log('Query: checkAuth');
		console.log('memberNick:', memberNick);
		return `Hi ${memberNick}`;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		console.log('Query: checkAuthRoles');
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`;
	}

	// Authentication
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: updateMember');
		delete input._id;
		// role and status are changed only by admin (updateMemberByAdmin)
		delete input.memberType;
		delete input.memberStatus;
		// password and phone change through their own checked flows (changePassword / changePhone)
		delete input.memberPassword;
		delete input.memberPhone;
		delete input.memberTrusted;
		console.log('memberId:', memberId);
		return await this.memberService.updateMember(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async changePassword(
		@Args('input') input: PasswordInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: changePassword');
		return await this.memberService.changePassword(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Member> {
		console.log('Query: getMember');
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(
		@Args('input') input: AgentsInquiry,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Members> {
		console.log('Query: getAgents');
		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		console.log('Mutation: likeTargetMember');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	//** ADMIN **/
	// Authorization: ADMIN
	@Mutation(() => Member)
	public async verifyAdminLogin(@Args('input') input: AdminCodeInput, @Context() context: any): Promise<Member> {
		console.log('Mutation: verifyAdminLogin');
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
		console.log('Mutation: updateMemberByAdmin');
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
	): Promise<string> {
		console.log('Mutation: imageUploader');
		if (!filename) throw new Error(Message.UPLOAD_FAILED);
		if (!validMimeTypes.includes(mimetype)) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
		if (!uploadTargets.includes(target)) throw new Error(Message.INVALID_UPLOAD_TARGET);

		// compressed to WebP and stored locally or on S3 (see StorageService)
		const buffer = await this.storageService.readStream(createReadStream());
		return await this.storageService.saveImage(buffer, target);
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: string,
	): Promise<string[]> {
		console.log('Mutation: imagesUploader');
		if (!uploadTargets.includes(target)) throw new Error(Message.INVALID_UPLOAD_TARGET);

		const uploadedImages: string[] = [];
		await Promise.all(
			files.map(async (img: Promise<FileUpload>, index: number) => {
				try {
					const { mimetype, createReadStream } = await img;
					if (!validMimeTypes.includes(mimetype)) throw new Error(Message.PROVIDE_ALLOWED_FORMAT);
					const buffer = await this.storageService.readStream(createReadStream());
					uploadedImages[index] = await this.storageService.saveImage(buffer, target);
				} catch (err) {
					console.log('Error, image skipped:', err instanceof Error ? err.message : err);
				}
			}),
		);
		// keep the original order, skip files that failed
		return uploadedImages.filter(Boolean);
	}
}
