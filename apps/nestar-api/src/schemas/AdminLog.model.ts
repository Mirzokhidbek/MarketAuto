import { Schema } from 'mongoose';

// who did what in the admin panel (kept 1 year)
const AdminLogSchema = new Schema(
	{
		adminId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
		action: { type: String, required: true }, // e.g. MEMBER_BLOCK, PROPERTY_REJECT
		targetType: { type: String, required: true }, // MEMBER | PROPERTY | ARTICLE | COMMENT | NOTICE | REPORT | SETTINGS | CHAT
		targetId: { type: String },
		details: { type: String },
		createdAt: { type: Date, default: Date.now, index: { expires: 365 * 24 * 60 * 60 } },
	},
	{ collection: 'adminLogs' },
);

export default AdminLogSchema;
