import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType, AdminRole } from '../../enums/member.enum';
import { IsNotEmpty, Min } from 'class-validator';
import { MeLiked } from '../like/like';
import { MeFollowed } from '../follow/follow';

@ObjectType()
export class Member {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => MemberType)
	memberType!: MemberType;

	@Field(() => MemberStatus)
	memberStatus!: MemberStatus;

	@Field(() => MemberAuthType)
	memberAuthType!: MemberAuthType;

	/** empty in public lists: a phone number is shown only on the member's profile and car pages */
	@Field(() => String, { nullable: true })
	memberPhone!: string;

	@Field(() => String)
	memberNick!: string;

	memberPassword?: string;

	@Field(() => Boolean)
	memberPhoneVerified!: boolean;

	/** private: only getMe and the admin panel return it (never in lists or other members' profiles) */
	@Field(() => String, { nullable: true })
	memberEmail?: string;

	@Field(() => Boolean, { nullable: true })
	memberEmailVerified?: boolean;

	@Field(() => Boolean)
	memberTrusted!: boolean;

	@Field(() => Boolean, { nullable: true })
	memberDealerVerified?: boolean;

	@Field(() => AdminRole, { nullable: true })
	memberAdminRole?: AdminRole;

	@Field(() => String, { nullable: true })
	memberBlockReason?: string;

	/** admin login: the password was right, now the SMS code is needed */
	@Field(() => Boolean, { nullable: true })
	twoFactorRequired?: boolean;

	/** development only (no SMS provider): the code, so the flow can be tested */
	@Field(() => String, { nullable: true })
	devCode?: string;

	@Field(() => Int, { nullable: true })
	memberResponseMinutes?: number;

	@Field(() => String, { nullable: true })
	memberFullName?: string;

	@Field(() => String)
	memberImage!: string;

	@Field(() => String, { nullable: true })
	memberAddress?: string;

	@Field(() => String, { nullable: true })
	memberDesc?: string;

	@Field(() => Int)
	memberProperties!: number;

	@Field(() => Int)
	memberArticles!: number;

	@Field(() => Int)
	memberFollowers!: number;

	@Field(() => Int)
	memberFollowings!: number;

	@Field(() => Int)
	memberLikes!: number;

	@Field(() => Int)
	memberViews!: number;

	@Field(() => Int)
	memberComments!: number;

	@Field(() => Int)
	memberRank!: number;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt!: Date;

	@Field(() => Date)
	updatedAt!: Date;

	@Field(() => String, { nullable: true })
	accessToken?: string;

	@Field(() => String, { nullable: true })
	refreshToken?: string;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => [MeFollowed], { nullable: true })
	meFollowed?: MeFollowed[];
}

@ObjectType()
export class TotalCounter {
	@Field(() => Int, { nullable: true })
	total!: number;
}

@ObjectType()
export class Members {
	@Field(() => [Member])
	list!: Member[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}
