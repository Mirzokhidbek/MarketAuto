import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, TotalCounter } from '../property/property';
import { MeFollowed } from '../follow/follow';

export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;
	memberPassword?: string;
	memberPhoneVerified?: boolean;
	memberTrusted?: boolean;
	memberDealerVerified?: boolean;
	memberResponseMinutes?: number;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberProperties: number;
	memberRank: number;
	memberArticles: number;
	memberLikes: number;
	memberFollowers?: number;
	memberFollowings?: number;
	memberViews: number;
	memberComments: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	// Enable for authentications
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	accessToken?: string;
	refreshToken?: string;
}

export interface Members {
	list: Member[];
	metaCounter: TotalCounter[];
}
