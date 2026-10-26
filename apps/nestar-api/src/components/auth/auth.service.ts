import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { createHash, randomBytes } from 'crypto';

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_DAYS ?? 30);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Session') private readonly sessionModel: Model<any>,
	) {}

	/**
	 * Login result: a short-lived access token (JWT, ACCESS_TOKEN_TTL, default 1h)
	 * plus a long-lived refresh token stored as a hash so it can be revoked.
	 */
	public async issueTokens(member: Member, userAgent?: string): Promise<Member> {
		const refreshToken = randomBytes(48).toString('hex');
		await this.sessionModel.create({
			memberId: member._id,
			tokenHash: hashToken(refreshToken),
			userAgent: userAgent?.slice(0, 200),
			expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
		});
		member.accessToken = await this.createToken(member);
		member.refreshToken = refreshToken;
		return member;
	}

	/** rotates the refresh token: the old one stops working */
	public async refreshSession(refreshToken: string, userAgent?: string): Promise<Member> {
		const session = await this.sessionModel.findOneAndDelete({ tokenHash: hashToken(refreshToken ?? '') }).exec();
		if (!session || session.expiresAt < new Date()) throw new UnauthorizedException(Message.SESSION_EXPIRED);

		const member = await this.memberModel.findById(session.memberId).exec();
		if (!member) throw new UnauthorizedException(Message.SESSION_EXPIRED);
		if (member.memberStatus === MemberStatus.BLOCK) throw new UnauthorizedException(Message.BLOCKED_USER);
		if (member.memberStatus !== MemberStatus.ACTIVE) throw new UnauthorizedException(Message.SESSION_EXPIRED);
		return await this.issueTokens(member, userAgent);
	}

	public async revokeSession(refreshToken: string): Promise<void> {
		await this.sessionModel.deleteOne({ tokenHash: hashToken(refreshToken ?? '') }).exec();
	}

	/** logs the member out everywhere (password change/reset, block) */
	public async revokeAllSessions(memberId: any): Promise<void> {
		await this.sessionModel.deleteMany({ memberId }).exec();
	}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};
		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});
		delete payload.memberPassword;
		delete payload.accessToken;
		delete payload.refreshToken;
		// console.log('payload:', payload);

		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const payload = await this.jwtService.verifyAsync<Member>(token);
		// blocked/deleted members and role changes take effect immediately, not when the token expires
		const member = await this.memberModel.findById(shapeIntoMongoObjectId(payload._id)).lean().exec();
		if (!member) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		if (member.memberStatus === MemberStatus.BLOCK) throw new UnauthorizedException(Message.BLOCKED_USER);
		if (member.memberStatus !== MemberStatus.ACTIVE) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		return member as Member;
	}
}
