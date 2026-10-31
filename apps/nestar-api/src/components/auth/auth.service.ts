import { settings } from '../../libs/env';
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

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// bcrypt cost: ~250 ms per guess on a server CPU; older hashes (cost 10) are upgraded at the next login
export const BCRYPT_ROUNDS = 12;
/** a rotated refresh token may arrive once more within this window (two requests racing); later = stolen */
const REUSE_GRACE_MS = 10 * 1000;
/** rotated tokens are remembered this long to recognise a stolen copy being replayed */
const REPLACED_KEEP_MS = 7 * 24 * 60 * 60 * 1000;
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
	public async issueTokens(member: Member, userAgent?: string, startedAt?: Date): Promise<Member> {
		const refreshToken = randomBytes(48).toString('hex');
		await this.sessionModel.create({
			memberId: member._id,
			tokenHash: hashToken(refreshToken),
			userAgent: userAgent?.slice(0, 200),
			// when this device logged in; kept across refresh-token rotations
			startedAt: startedAt ?? new Date(),
			expiresAt: new Date(Date.now() + settings.refreshTokenDays * 24 * 60 * 60 * 1000),
		});
		member.accessToken = await this.createToken(member);
		member.refreshToken = refreshToken;
		return member;
	}

	/**
	 * Rotates the refresh token: the old one stops working but is remembered for a week. If that old token
	 * shows up again later, two parties hold it (it was stolen), so every session of the member ends.
	 */
	public async refreshSession(refreshToken: string, userAgent?: string): Promise<Member> {
		const now = new Date();
		const session = await this.sessionModel
			.findOneAndUpdate(
				{ tokenHash: hashToken(refreshToken ?? ''), replacedAt: null },
				{ replacedAt: now, expiresAt: new Date(now.getTime() + REPLACED_KEEP_MS) },
			)
			.exec();
		if (!session) {
			const replayed = await this.sessionModel
				.findOne({ tokenHash: hashToken(refreshToken ?? '') })
				.lean()
				.exec();
			if (replayed?.replacedAt && now.getTime() - new Date(replayed.replacedAt).getTime() > REUSE_GRACE_MS) {
				await this.revokeAllSessions(replayed.memberId);
				throw new UnauthorizedException(Message.SESSION_REUSED);
			}
			throw new UnauthorizedException(Message.SESSION_EXPIRED);
		}
		if (session.expiresAt < now) throw new UnauthorizedException(Message.SESSION_EXPIRED);

		const member = await this.memberModel.findById(session.memberId).exec();
		if (!member) throw new UnauthorizedException(Message.SESSION_EXPIRED);
		if (member.memberStatus === MemberStatus.BLOCK) throw new UnauthorizedException(Message.BLOCKED_USER);
		if (member.memberStatus !== MemberStatus.ACTIVE) throw new UnauthorizedException(Message.SESSION_EXPIRED);
		return await this.issueTokens(member, userAgent, session.startedAt ?? session.createdAt);
	}

	public async revokeSession(refreshToken: string): Promise<void> {
		await this.sessionModel.deleteOne({ tokenHash: hashToken(refreshToken ?? '') }).exec();
	}

	/** the member's logged-in devices (live sessions only), newest activity first */
	public async listSessions(memberId: any, currentToken?: string): Promise<any[]> {
		const currentHash = currentToken ? hashToken(currentToken) : null;
		const sessions = await this.sessionModel
			.find({ memberId, replacedAt: null, expiresAt: { $gt: new Date() } })
			.sort({ createdAt: -1 })
			.lean()
			.exec();
		return sessions.map((s: any) => ({
			_id: String(s._id),
			userAgent: s.userAgent ?? '',
			startedAt: s.startedAt ?? s.createdAt,
			lastActiveAt: s.createdAt,
			current: s.tokenHash === currentHash,
		}));
	}

	/** logs one device out; only the member's own sessions can be removed */
	public async revokeSessionById(memberId: any, sessionId: string): Promise<boolean> {
		const result = await this.sessionModel.deleteOne({ _id: shapeIntoMongoObjectId(sessionId), memberId }).exec();
		return result.deletedCount > 0;
	}

	/** every device except the one making the request */
	public async revokeOtherSessions(memberId: any, currentToken?: string): Promise<number> {
		const filter: T = { memberId };
		if (currentToken) filter.tokenHash = { $ne: hashToken(currentToken) };
		const result = await this.sessionModel.deleteMany(filter).exec();
		return result.deletedCount;
	}

	/** true when the member has logged in before, but never from this browser */
	public async isNewDevice(memberId: any, userAgent?: string): Promise<boolean> {
		const any = await this.sessionModel.exists({ memberId });
		if (!any) return false;
		return !(await this.sessionModel.exists({ memberId, userAgent: userAgent?.slice(0, 200) }));
	}

	/** logs the member out everywhere (password change/reset, block) */
	public async revokeAllSessions(memberId: any): Promise<void> {
		await this.sessionModel.deleteMany({ memberId }).exec();
	}

	public async hashPassword(memberPassword: string): Promise<string> {
		return await bcrypt.hash(memberPassword, BCRYPT_ROUNDS);
	}

	public needsRehash(hashedPassword: string): boolean {
		try {
			return bcrypt.getRounds(hashedPassword) < BCRYPT_ROUNDS;
		} catch {
			return false;
		}
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
		// the email is read too: getMe returns it to its owner (other queries never pass it on)
		const member = await this.memberModel
			.findById(shapeIntoMongoObjectId(payload._id))
			.select('+memberEmail')
			.lean()
			.exec();
		if (!member) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		if (member.memberStatus === MemberStatus.BLOCK) throw new UnauthorizedException(Message.BLOCKED_USER);
		if (member.memberStatus !== MemberStatus.ACTIVE) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		return member;
	}
}
