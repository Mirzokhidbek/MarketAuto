import { Schema } from 'mongoose';
import { AdminRole, MemberAuthType, MemberStatus, MemberType } from '../libs/enums/member.enum';

const MemberSchema = new Schema(
	{
		memberType: {
			type: String,
			enum: MemberType,
			default: MemberType.USER,
		},

		memberStatus: {
			type: String,
			enum: MemberStatus,
			default: MemberStatus.ACTIVE,
		},

		memberAuthType: {
			type: String,
			enum: MemberAuthType,
			default: MemberAuthType.PHONE,
		},

		memberPhone: {
			type: String,
			index: { unique: true, sparse: true },
			required: true,
		},

		memberNick: {
			type: String,
			index: { unique: true, sparse: true },
			required: true,
		},

		// set after the SMS code is confirmed
		memberPhoneVerified: {
			type: Boolean,
			default: false,
		},

		// trusted members publish instantly; others wait for admin approval
		memberTrusted: {
			type: Boolean,
			default: false,
		},

		// only for admins
		memberAdminRole: {
			type: String,
			enum: AdminRole,
		},

		// why an admin blocked this member (shown in the admin panel)
		memberBlockReason: {
			type: String,
		},

		// admin checked the dealership documents
		memberDealerVerified: {
			type: Boolean,
			default: false,
		},

		// typical time (minutes) to answer a buyer's message, rolling average
		memberResponseMinutes: {
			type: Number,
		},

		memberPassword: {
			type: String,
			select: false,
			required: true,
		},

		memberFullName: {
			type: String,
		},

		memberImage: {
			type: String,
			default: '',
		},

		memberAddress: {
			type: String,
		},

		memberDesc: {
			type: String,
		},

		memberProperties: {
			type: Number,
			default: 0,
		},

		memberArticles: {
			type: Number,
			default: 0,
		},

		memberFollowers: {
			type: Number,
			default: 0,
		},

		memberFollowings: {
			type: Number,
			default: 0,
		},


		memberLikes: {
			type: Number,
			default: 0,
		},

		memberViews: {
			type: Number,
			default: 0,
		},

		memberComments: {
			type: Number,
			default: 0,
		},

		memberRank: {
			type: Number,
			default: 0,
		},



		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'members' },
);

export default MemberSchema;
