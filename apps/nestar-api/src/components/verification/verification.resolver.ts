import { BadRequestException } from '@nestjs/common';
import { VerificationPurpose } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { VerificationService } from './verification.service';
import { PhoneCodeInput, PhoneCodeResult } from '../../libs/dto/verification/verification';
import { clientIp } from '../../libs/config';

@Resolver()
export class VerificationResolver {
	constructor(private readonly verificationService: VerificationService) {}

	@Mutation(() => PhoneCodeResult)
	public async requestPhoneCode(@Args('input') input: PhoneCodeInput, @Context() context: any): Promise<PhoneCodeResult> {
		console.log('Mutation: requestPhoneCode');
		// admin login codes are sent only after a correct password (MemberService.login)
		if (input.purpose === VerificationPurpose.ADMIN_2FA) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		return await this.verificationService.requestCode(input.phone, input.purpose, clientIp(context));
	}
}
