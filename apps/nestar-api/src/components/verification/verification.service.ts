import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomInt } from 'crypto';
import { SmsService } from './sms.service';
import { PhoneCodeResult } from '../../libs/dto/verification/verification';
import { VerificationPurpose } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { isValidPhone, limiters, normalizePhone } from '../../libs/rate-limiter';

const CODE_TTL_SECONDS = 5 * 60;
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class VerificationService {
	constructor(
		@InjectModel('Verification') private readonly verificationModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		private readonly smsService: SmsService,
	) {}

	private hash(phone: string, purpose: string, code: string): string {
		return createHash('sha256').update(`${phone}:${purpose}:${code}:${process.env.SECRET_TOKEN}`).digest('hex');
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
		const forExisting = purpose === VerificationPurpose.RESET_PASSWORD || purpose === VerificationPurpose.LOGIN;
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

		const sent = await this.smsService.send(phone, `MarketAuto: tasdiqlash kodi ${code}. Kodni hech kimga bermang.`);
		if (!sent) throw new BadRequestException(Message.CODE_NOT_SENT);

		const devCode =
			process.env.NODE_ENV !== 'production' && !this.smsService.hasProvider(phone) ? code : undefined;
		return { sent: true, expiresIn: CODE_TTL_SECONDS, devCode };
	}

	/** checks the code once; throws on a wrong/expired code. Returns the normalized phone. */
	public async consumeCode(rawPhone: string, purpose: VerificationPurpose, code: string): Promise<string> {
		const phone = this.normalize(rawPhone);
		const limitKey = `${phone}:${purpose}`;
		limiters.codeCheck.assert(limitKey);

		const record = await this.verificationModel.findOne({ phone, purpose }).exec();
		if (!record || record.expiresAt < new Date()) {
			limiters.codeCheck.hit(limitKey);
			throw new BadRequestException(Message.WRONG_CODE);
		}
		if (record.codeHash !== this.hash(phone, purpose, String(code ?? '').trim())) {
			limiters.codeCheck.hit(limitKey);
			record.attempts += 1;
			if (record.attempts >= MAX_CODE_ATTEMPTS) await record.deleteOne();
			else await record.save();
			throw new BadRequestException(Message.WRONG_CODE);
		}

		await record.deleteOne();
		limiters.codeCheck.reset(limitKey);
		return phone;
	}
}
