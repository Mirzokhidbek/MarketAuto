import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { AdminRole, MemberStatus, MemberType } from '../../enums/member.enum';
import type { ObjectId } from 'mongoose';

@InputType()
export class MemberUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId | undefined;

	@IsOptional()
	@Field(() => MemberType, { nullable: true })
	memberType?: MemberType;

	@IsOptional()
	@Field(() => MemberStatus, { nullable: true })
	memberStatus?: MemberStatus;

	/** admin only: trusted members publish listings without moderation */
	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	memberTrusted?: boolean;

	/** super admin only: makes a member an admin with this role */
	@IsOptional()
	@Field(() => AdminRole, { nullable: true })
	memberAdminRole?: AdminRole;

	/** admin only: shown in the admin panel when the member is blocked */
	@IsOptional()
	@Length(0, 300)
	@Field(() => String, { nullable: true })
	memberBlockReason?: string;

	/** admin only: dealership documents checked */
	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	memberDealerVerified?: boolean;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberPhone?: string;

	@IsOptional()
	@Length(3, 12)
	@Field(() => String, { nullable: true })
	memberNick?: string;

	@IsOptional()
	@Length(5, 12)
	@Field(() => String, { nullable: true })
	memberPassword?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberImage?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberDesc?: string; // Corrected typo 'memberDesx' from screenshot

	deletedAt?: Date;
}
