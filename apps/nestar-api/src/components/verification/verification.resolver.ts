import { BadRequestException } from '@nestjs/common';
import { VerificationPurpose } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { VerificationService } from './verification.service';
import { EmailCodeInput, PhoneCodeInput, PhoneCodeResult } from '../../libs/dto/verification/verification';
import { clientIp } from '../../libs/config';

@Resolver()
export class VerificationResolver {
	constructor(private readonly verificationService: VerificationService) {}

	@Mutation(() => PhoneCodeResult)
	public async requestPhoneCode(
		@Args('input') input: PhoneCodeInput,
		@Context() context: any,
	): Promise<PhoneCodeResult> {
		// admin login codes are sent only after a correct password (MemberService.login)
		if (input.purpose === VerificationPurpose.ADMIN_2FA || input.purpose === VerificationPurpose.VERIFY_EMAIL)
			throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		return await this.verificationService.requestCode(input.phone, input.purpose, clientIp(context));
	}

	/** email codes: SIGNUP, RESET_PASSWORD and VERIFY_EMAIL (adding or changing the account email) */
	@Mutation(() => PhoneCodeResult)
	public async requestEmailCode(
		@Args('input') input: EmailCodeInput,
		@Context() context: any,
	): Promise<PhoneCodeResult> {
		return await this.verificationService.requestEmailCode(input.email, input.purpose, clientIp(context));
	}
}
