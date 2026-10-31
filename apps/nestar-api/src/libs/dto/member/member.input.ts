import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min, Max, Matches } from 'class-validator';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { Direction } from '../../enums/common.enum';
import { availableAgentSorts, availableMemberSorts } from '../../config';

@InputType()
export class MemberInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Matches(/^[a-zA-Z0-9_.]+$/, { message: 'Nickname may contain only latin letters, digits, "_" and "."' })
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(8, 64)
	@Field(() => String)
	memberPassword!: string;

	@IsNotEmpty()
	@Field(() => String)
	memberPhone!: string;

	/** 6-digit SMS code from requestPhoneCode(purpose: SIGNUP) */
	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	verificationCode!: string;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberAuthType, { nullable: true })
	memberAuthType?: MemberAuthType;
}

/** registration with an email address instead of a phone number (code from requestEmailCode, purpose SIGNUP) */
@InputType()
export class EmailSignupInput {
	@IsNotEmpty()
	@Length(3, 12)
	@Matches(/^[a-zA-Z0-9_.]+$/, { message: 'Nickname may contain only latin letters, digits, "_" and "."' })
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(8, 64)
	@Field(() => String)
	memberPassword!: string;

	@IsNotEmpty()
	@Length(5, 254)
	@Field(() => String)
	memberEmail!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	verificationCode!: string;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;
}

@InputType()
export class PasswordInput {
	// old accounts may still have a short password, so only the new one follows the new rules
	@IsNotEmpty()
	@Length(1, 64)
	@Field(() => String)
	currentPassword!: string;

	@IsNotEmpty()
	@Length(8, 64)
	@Field(() => String)
	newPassword!: string;
}

@InputType()
export class AdminCodeInput {
	@IsNotEmpty()
	@Length(3, 20)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(6, 6)
	@Field(() => String)
	code!: string;
}

@InputType()
export class LoginInput {
	/** nickname, phone number or email */
	@IsNotEmpty()
	@Length(3, 254)
	@Field(() => String)
	memberNick!: string;

	@IsNotEmpty()
	@Length(1, 64)
	@Field(() => String)
	memberPassword!: string;
}

@InputType()
class AISearch {
	@IsNotEmpty()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AgentsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableAgentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AISearch)
	search!: AISearch;
}

@InputType()
class MISearch {
	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class MembersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;

	@IsOptional()
	@IsIn(availableMemberSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => MISearch)
	search!: MISearch;
}
