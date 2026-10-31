import { settings } from '../../libs/env';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomInt } from 'crypto';
import { SmsService } from './sms.service';
import { MailService } from './mail.service';
import { PhoneCodeResult } from '../../libs/dto/verification/verification';
import { VerificationPurpose } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { isValidEmail, isValidPhone, limiters, normalizeEmail, normalizePhone } from '../../libs/rate-limiter';

const CODE_TTL_SECONDS = 5 * 60;
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class VerificationService {
	constructor(
		@InjectModel('Verification') private readonly verificationModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		private readonly smsService: SmsService,
		private readonly mailService: MailService,
	) {}

	private hash(phone: string, purpose: string, code: string): string {
		return createHash('sha256').update(`${phone}:${purpose}:${code}:${settings.secretToken}`).digest('hex');
	}

	/** validated, normalized phone ("998901234567") or an error */
	public normalize(phone: string): string {
		const normalized = normalizePhone(phone);
		if (!isValidPhone(normalized)) throw new BadRequestException(Message.INVALID_PHONE);
		return normalized;
	}

	public async requestCode(rawPhone: string, purpose: VerificationPurpose, ip: string): Promise<PhoneCodeResult> {
		const phone = this.normalize(rawPhone);
		limiters.smsIp.consume(ip);
		limiters.smsPhone.consume(phone);

		const exists = await this.memberModel.exists({ memberPhone: phone });
		const forExisting = [
			VerificationPurpose.RESET_PASSWORD,
			VerificationPurpose.LOGIN,
			VerificationPurpose.ADMIN_2FA,
		].includes(purpose);
		if (!forExisting && exists) throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
		// unknown number on login / password reset: answer the same way, but send nothing (no account enumeration)
		if (forExisting && !exists) return { sent: true, expiresIn: CODE_TTL_SECONDS };

		const code = String(randomInt(100000, 1000000));
		await this.verificationModel.deleteMany({ phone, purpose });
		await this.verificationModel.create({
			phone,
			purpose,
			codeHash: this.hash(phone, purpose, code),
			expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
		});

		const sent = await this.smsService.send(phone, `CarPort: tasdiqlash kodi ${code}. Kodni hech kimga bermang.`);
		if (!sent) throw new BadRequestException(Message.CODE_NOT_SENT);

		const devCode = !settings.production && !this.smsService.hasProvider(phone) ? code : undefined;
		return { sent: true, expiresIn: CODE_TTL_SECONDS, devCode };
	}

	/** checks the code once; throws on a wrong/expired code. Returns the normalized phone. */
	public async consumeCode(rawPhone: string, purpose: VerificationPurpose, code: string): Promise<string> {
		const phone = this.normalize(rawPhone);
		await this.checkCode({ phone, purpose }, phone, code);
		return phone;
	}

	/** validated, normalized email ("name@mail.uz") or an error */
	public normalizeEmail(email: string): string {
		const normalized = normalizeEmail(email);
		if (!isValidEmail(normalized)) throw new BadRequestException(Message.INVALID_EMAIL);
		return normalized;
	}

	/** the same rules as SMS codes: 6 digits, 5 minutes, 5 attempts, no account enumeration on login/reset */
	public async requestEmailCode(rawEmail: string, purpose: VerificationPurpose, ip: string): Promise<PhoneCodeResult> {
		const email = this.normalizeEmail(rawEmail);
		limiters.emailIp.consume(ip);
		limiters.emailAddress.consume(email);

		const exists = await this.memberModel.exists({ memberEmail: email });
		if (purpose === VerificationPurpose.SIGNUP || purpose === VerificationPurpose.VERIFY_EMAIL) {
			if (exists) throw new BadRequestException(Message.USED_EMAIL);
		} else if (purpose === VerificationPurpose.RESET_PASSWORD) {
			if (!exists) return { sent: true, expiresIn: CODE_TTL_SECONDS };
		} else throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const code = String(randomInt(100000, 1000000));
		await this.verificationModel.deleteMany({ email, purpose });
		await this.verificationModel.create({
			email,
			purpose,
			codeHash: this.hash(`email:${email}`, purpose, code),
			expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
		});

		const subject =
			purpose === VerificationPurpose.RESET_PASSWORD ? 'CarPort: parolni tiklash kodi' : 'CarPort: tasdiqlash kodi';
		const sent = await this.mailService.send(email, subject, [
			`Tasdiqlash kodingiz: ${code}`,
			'Kod 5 daqiqa amal qiladi. Uni hech kimga bermang — CarPort xodimlari kodni hech qachon soʻramaydi.',
			'Agar bu soʻrovni siz yubormagan boʻlsangiz, xatni eʼtiborsiz qoldiring.',
		]);
		if (!sent) throw new BadRequestException(Message.EMAIL_NOT_SENT);

		const devCode = !settings.production && !this.mailService.hasProvider() ? code : undefined;
		return { sent: true, expiresIn: CODE_TTL_SECONDS, devCode };
	}

	/** checks an email code once; returns the normalized email */
	public async consumeEmailCode(rawEmail: string, purpose: VerificationPurpose, code: string): Promise<string> {
		const email = this.normalizeEmail(rawEmail);
		await this.checkCode({ email, purpose }, `email:${email}`, code);
		return email;
	}

	private async checkCode(
		filter: { phone?: string; email?: string; purpose: VerificationPurpose },
		target: string,
		code: string,
	) {
		const limitKey = `${target}:${filter.purpose}`;
		limiters.codeCheck.assert(limitKey);

		const record = await this.verificationModel.findOne(filter).exec();
		if (!record || record.expiresAt < new Date()) {
			limiters.codeCheck.hit(limitKey);
			throw new BadRequestException(Message.WRONG_CODE);
		}
		if (record.codeHash !== this.hash(target, filter.purpose, String(code ?? '').trim())) {
			limiters.codeCheck.hit(limitKey);
			record.attempts += 1;
			if (record.attempts >= MAX_CODE_ATTEMPTS) await record.deleteOne();
			else await record.save();
			throw new BadRequestException(Message.WRONG_CODE);
		}

		await record.deleteOne();
		limiters.codeCheck.reset(limitKey);
	}
}
