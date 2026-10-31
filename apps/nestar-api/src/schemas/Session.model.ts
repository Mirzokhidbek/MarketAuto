import { Schema } from 'mongoose';

// refresh-token sessions (only a hash of the token is stored); expired ones are removed by MongoDB
const SessionSchema = new Schema(
	{
		memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
		tokenHash: { type: String, required: true, unique: true },
		userAgent: { type: String },
		// first login of this device; createdAt is the last refresh (the token is rotated on every refresh)
		startedAt: { type: Date },
		// set when the token was rotated: a later use of it means a stolen copy (see AuthService.refreshSession)
		replacedAt: { type: Date, default: null },
		expiresAt: { type: Date, required: true, index: { expires: 0 } },
	},
	{ timestamps: true, collection: 'sessions' },
);

export default SessionSchema;
