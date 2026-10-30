import { BadRequestException } from '@nestjs/common';
import { Message } from './enums/common.enum';
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ObjectId } from 'bson';

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];

export const availableOptions = ['propertyBarter', 'propertyNegotiable', 'carCustomsCleared'];
export const availablePropertySorts = [
	'createdAt',
	'updatedAt',
	'propertyLikes',
	'propertyViews',
	'propertyRank',
	'propertyPrice',
	'carYear',
	'carMileage',
];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];

/** IMAGE CONFIGURATION **/
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
// only these folders can be written to; anything else (e.g. '../../') is rejected
export const uploadTargets = ['member', 'property', 'article', 'message'];

/** caller IP from the GraphQL context (set TRUST_PROXY=1 behind nginx so X-Forwarded-For is used) */
export const clientIp = (context: any): string => context?.req?.ip ?? context?.req?.socket?.remoteAddress ?? 'unknown';

// user text is matched literally: '(' or '.*' must not break or slow down the query
export const searchRegex = (text: string): RegExp =>
	new RegExp(
		text
			.trim()
			.slice(0, 100)
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
		'i',
	);

/** an ObjectId (or any id) as its hex string; '' for null/undefined. Use it to compare or key ids. */
export const idString = (id: unknown): string => {
	if (id === null || id === undefined) return '';
	if (typeof id === 'string') return id;
	// ObjectId (bson / mongoose) and anything else that knows its own string form
	if (typeof id === 'object' && 'toHexString' in id && typeof id.toHexString === 'function')
		return (id as { toHexString(): string }).toHexString();
	return (id as { toString(): string }).toString();
};

export const shapeIntoMongoObjectId = (target: any) => {
	if (typeof target !== 'string') return target;
	// a malformed id is the caller's mistake (400), not a server error (500)
	if (!ObjectId.isValid(target)) throw new BadRequestException(Message.BAD_REQUEST);
	return new ObjectId(target);
};

export const lookupAuthMemberLiked = (memberId: T, targetRefId: string = '$_id') => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$likeRefId', '$$localLikeRefId'] }, { $eq: ['$memberId', '$$localMemberId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}

export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

// public lists never carry phone numbers: a seller's phone is shown only on their profile and car pages
const publicMemberFields = [{ $project: { memberPhone: 0, memberPassword: 0 } }];

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		pipeline: publicMemberFields,
		as: 'memberData',
	},
};

/** admin lists: the member with the phone number */
export const lookupMemberForAdmin = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		pipeline: [{ $project: { memberPassword: 0 } }],
		as: 'memberData',
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		pipeline: publicMemberFields,
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		pipeline: publicMemberFields,
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'members',
		localField: 'favoriteProperty.memberId',
		foreignField: '_id',
		pipeline: publicMemberFields,
		as: 'favoriteProperty.memberData',
	},
};

export const lookupVisit = {
	$lookup: {
		from: 'members',
		localField: 'visitedProperty.memberId',
		foreignField: '_id',
		pipeline: publicMemberFields,
		as: 'visitedProperty.memberData',
	},
};

/** any other member join in a public list (notification author, chat partner) */
export const lookupPublicMember = (localField: string, as: string) => ({
	$lookup: { from: 'members', localField, foreignField: '_id', pipeline: publicMemberFields, as },
});
