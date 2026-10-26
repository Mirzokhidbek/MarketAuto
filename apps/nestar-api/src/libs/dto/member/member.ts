import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
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

	@Field(() => String)
	memberPhone!: string;

	@Field(() => String)
	memberNick!: string;

	memberPassword?: string;

	@Field(() => Boolean)
	memberPhoneVerified!: boolean;

	@Field(() => Boolean)
	memberTrusted!: boolean;

	@Field(() => Boolean, { nullable: true })
	memberDealerVerified?: boolean;

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
