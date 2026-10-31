import { Schema } from 'mongoose';
import { VerificationPurpose } from '../libs/enums/member.enum';

// one-time SMS or email codes (one of phone / email is set); MongoDB removes them automatically after expiresAt
const VerificationSchema = new Schema(
	{
		phone: { type: String, index: true },
		email: { type: String, index: true },
		purpose: { type: String, enum: VerificationPurpose, required: true },
		codeHash: { type: String, required: true },
		attempts: { type: Number, default: 0 },
		expiresAt: { type: Date, required: true, index: { expires: 0 } },
	},
	{ timestamps: true, collection: 'verifications' },
);

export default VerificationSchema;
