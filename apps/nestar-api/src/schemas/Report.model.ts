import { Schema } from 'mongoose';
import { ReportReason, ReportStatus } from '../libs/enums/property.enum';

// complaints about listings ("fake", "already sold", ...); one per member per listing
const ReportSchema = new Schema(
	{
		propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
		memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
		reportReason: { type: String, enum: ReportReason, required: true },
		reportComment: { type: String, maxlength: 500 },
		reportStatus: { type: String, enum: ReportStatus, default: ReportStatus.OPEN },
	},
	{ timestamps: true, collection: 'reports' },
);
ReportSchema.index({ propertyId: 1, memberId: 1 }, { unique: true });

export default ReportSchema;
