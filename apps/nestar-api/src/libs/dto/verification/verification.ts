import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
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
export class EmailCodeInput {
	@IsNotEmpty()
	@Length(5, 254)
	@Field(() => String)
	email!: string;

	/** SIGNUP, RESET_PASSWORD or VERIFY_EMAIL */
	@IsNotEmpty()
	@Field(() => VerificationPurpose)
	purpose!: VerificationPurpose;
}

/** the code went to the account phone or to the account email: give exactly one of them */
@InputType()
export class ResetPasswordInput {
	@IsOptional()
	@Length(9, 20)
	@Field(() => String, { nullable: true })
	phone?: string;

	@IsOptional()
	@Length(5, 254)
	@Field(() => String, { nullable: true })
	email?: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;

	@IsNotEmpty()
	@Length(8, 64)
	@Field(() => String)
	newPassword!: string;
}

@InputType()
export class ChangeEmailInput {
	@IsNotEmpty()
	@Length(5, 254)
	@Field(() => String)
	email!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;
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
