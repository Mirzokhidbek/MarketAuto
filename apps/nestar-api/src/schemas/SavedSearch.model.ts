import { Schema } from 'mongoose';

// "notify me about new cars like this": search filters a member saved from the car search page
const SavedSearchSchema = new Schema(
	{
		memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
		title: { type: String, required: true },
		search: { type: Object, required: true }, // PropertiesInquiry.search
		lastNotifiedAt: { type: Date },
	},
	{ timestamps: true, collection: 'savedSearches' },
);

export default SavedSearchSchema;
