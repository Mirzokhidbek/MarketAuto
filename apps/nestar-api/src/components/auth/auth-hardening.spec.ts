import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthService, BCRYPT_ROUNDS } from './auth.service';
import { passwordProblem } from '../../libs/password';
import { VerificationService } from '../verification/verification.service';
import { VerificationPurpose } from '../../libs/enums/member.enum';
import { limiters } from '../../libs/rate-limiter';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

describe('passwordProblem', () => {
	it('asks for 8+ characters with letters and digits, not common, not personal', () => {
		expect(passwordProblem('Avto2026yil')).toBeNull();
		expect(passwordProblem('a1b2c3')).toBe('LENGTH');
		expect(passwordProblem('onlyletters')).toBe('LETTERS_AND_DIGITS');
		expect(passwordProblem('1234567890')).toBe('LETTERS_AND_DIGITS');
		expect(passwordProblem('Password123')).toBe('COMMON');
		expect(passwordProblem('dilnoza88abc', 'dilnoza88')).toBe('PERSONAL');
		expect(passwordProblem('ali.karim99x', undefined, 'ali.karim@mail.uz')).toBe('PERSONAL');
		expect(passwordProblem('x'.repeat(60) + '12345')).toBe('LENGTH');
	});
});

describe('AuthService sessions', () => {
	const setup = (stored: any[]) => {
		const sessionModel = {
			findOneAndUpdate: jest.fn((filter: any, update: any) => ({
				exec: async () => {
					const row = stored.find((s) => s.tokenHash === filter.tokenHash && !s.replacedAt);
					if (row) Object.assign(row, update);
					return row ?? null;
				},
			})),
			findOne: jest.fn((filter: any) => ({
				lean: () => ({ exec: async () => stored.find((s) => s.tokenHash === filter.tokenHash) ?? null }),
			})),
			create: jest.fn(async (doc: any) => stored.push(doc)),
			deleteMany: jest.fn((filter: any) => ({
				exec: async () => {
					const before = stored.length;
					stored.splice(0, stored.length, ...stored.filter((s) => String(s.memberId) !== String(filter.memberId)));
					return { deletedCount: before - stored.length };
				},
			})),
		};
		const member = { _id: 'm1', memberStatus: 'ACTIVE', memberNick: 'ali' };
		const memberModel = { findById: jest.fn(() => ({ exec: async () => member })) };
		const jwt = { signAsync: jest.fn(async () => 'access') };
		return { service: new AuthService(jwt as any, memberModel as any, sessionModel as any), stored };
	};
	const live = (token: string, extra: any = {}) => ({
		memberId: 'm1',
		tokenHash: hash(token),
		replacedAt: null,
		startedAt: new Date('2026-10-01'),
		expiresAt: new Date(Date.now() + 86400000),
		...extra,
	});

	it('rotates the refresh token and keeps the device login time', async () => {
		const { service, stored } = setup([live('old')]);
		const result = await service.refreshSession('old', 'Chrome');
		expect(result.accessToken).toBe('access');
		expect(stored[0].replacedAt).toBeInstanceOf(Date);
		expect(stored[1].startedAt).toEqual(new Date('2026-10-01'));
	});

	it('a rotated token used again later ends every session of the member (stolen copy)', async () => {
		const { service, stored } = setup([live('old', { replacedAt: new Date(Date.now() - 60000) }), live('other')]);
		await expect(service.refreshSession('old')).rejects.toThrow(UnauthorizedException);
		expect(stored).toHaveLength(0);
	});

	it('a token replayed within seconds (two tabs racing) is only refused', async () => {
		const { service, stored } = setup([live('old', { replacedAt: new Date() }), live('other')]);
		await expect(service.refreshSession('old')).rejects.toThrow(UnauthorizedException);
		expect(stored).toHaveLength(2);
	});

	it('hashes with the stronger cost and spots old hashes', async () => {
		const { service } = setup([]);
		const strong = await service.hashPassword('Avto2026yil');
		expect(bcrypt.getRounds(strong)).toBe(BCRYPT_ROUNDS);
		expect(service.needsRehash(strong)).toBe(false);
		expect(service.needsRehash(bcrypt.hashSync('x', 10))).toBe(true);
	});
});

describe('VerificationService email codes', () => {
	const setup = (existingEmail = false) => {
		const records: any[] = [];
		const verificationModel = {
			deleteMany: jest.fn(async () => undefined),
			create: jest.fn(async (doc: any) => records.push({ ...doc, attempts: 0, deleteOne: jest.fn(), save: jest.fn() })),
			findOne: jest.fn((filter: any) => ({
				exec: async () => records.find((r) => r.email === filter.email && r.purpose === filter.purpose) ?? null,
			})),
		};
		const memberModel = { exists: jest.fn(async () => existingEmail) };
		const mail = { send: jest.fn(async () => true), hasProvider: () => false };
		const service = new VerificationService(verificationModel as any, memberModel as any, {} as any, mail as any);
		return { service, mail, records };
	};

	beforeEach(() => {
		Object.values(limiters).forEach((limiter: any) => limiter.hits?.clear?.());
	});

	it('sends a signup code to a new address and accepts it once', async () => {
		const { service, mail } = setup();
		const sent = await service.requestEmailCode(' Ali@Mail.UZ ', VerificationPurpose.SIGNUP, '1.1.1.1');
		expect(mail.send).toHaveBeenCalledWith('ali@mail.uz', expect.any(String), expect.any(Array));
		expect(await service.consumeEmailCode('ali@mail.uz', VerificationPurpose.SIGNUP, sent.devCode!)).toBe(
			'ali@mail.uz',
		);
	});

	it('refuses a used address on signup, and stays silent for an unknown address on reset', async () => {
		await expect(setup(true).service.requestEmailCode('a@b.uz', VerificationPurpose.SIGNUP, '1.1.1.2')).rejects.toThrow(
			BadRequestException,
		);
		const { service, mail } = setup(false);
		const result = await service.requestEmailCode('nobody@b.uz', VerificationPurpose.RESET_PASSWORD, '1.1.1.3');
		expect(result.sent).toBe(true);
		expect(mail.send).not.toHaveBeenCalled();
	});

	it('rejects a wrong code and a bad address', async () => {
		const { service } = setup();
		await service.requestEmailCode('vali@mail.uz', VerificationPurpose.SIGNUP, '1.1.1.4');
		await expect(service.consumeEmailCode('vali@mail.uz', VerificationPurpose.SIGNUP, '000000')).rejects.toThrow();
		await expect(service.requestEmailCode('not-an-email', VerificationPurpose.SIGNUP, '1.1.1.5')).rejects.toThrow();
	});
});
