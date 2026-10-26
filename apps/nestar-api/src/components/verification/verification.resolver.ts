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
		return await this.verificationService.requestCode(input.phone, input.purpose, clientIp(context));
	}
}
