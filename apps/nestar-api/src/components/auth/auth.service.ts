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
// what the site needs before getMe answers: who is logged in, which role, which avatar
export const TOKEN_CLAIMS = [
	'_id',
	'memberNick',
	'memberType',
	'memberStatus',
	'memberAuthType',
	'memberImage',
	'memberAdminRole',
];

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
		// the token proves identity only; it is readable by anyone who holds it, so no phone or other personal data.
		// The site loads the rest of the profile with getMe.
		const source: T = member['_doc'] ?? member;
		const payload: T = {};
		for (const key of TOKEN_CLAIMS) if (source[key] !== undefined && source[key] !== null) payload[key] = source[key];
		payload._id = String(source._id);
		return await this.jwtService.signAsync(payload);
	}

	/** expiry time of an access token in ms (null when it cannot be read) */
	public tokenExpiresAt(token: string): number | null {
		const payload = this.jwtService.decode<{ exp?: number } | null>(token);
		return payload?.exp ? payload.exp * 1000 : null;
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
