import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';
import { VerificationPurpose } from '../../enums/member.enum';

@InputType()
export class PhoneCodeInput {
	@IsNotEmpty()
	@Length(9, 20)
	@Field(() => String)
	phone!: string;

	@IsNotEmpty()
	@Field(() => VerificationPurpose)
	purpose!: VerificationPurpose;
}

@ObjectType()
export class PhoneCodeResult {
	@Field(() => Boolean)
	sent!: boolean;

	@Field(() => Int)
	expiresIn!: number;

	/** only in development when no SMS provider is configured, so the flow can be tested */
	@Field(() => String, { nullable: true })
	devCode?: string;
}

@InputType()
export class ResetPasswordInput {
	@IsNotEmpty()
	@Length(9, 20)
	@Field(() => String)
	phone!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;

	@IsNotEmpty()
	@Length(5, 12)
	@Field(() => String)
	newPassword!: string;
}

@InputType()
export class ChangePhoneInput {
	@IsNotEmpty()
	@Length(9, 20)
	@Field(() => String)
	phone!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;
}

@InputType()
export class CodeLoginInput {
	@IsNotEmpty()
	@Length(9, 20)
	@Field(() => String)
	phone!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;
}
