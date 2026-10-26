import { Schema } from 'mongoose';

// one private dialog between two members, optionally about a specific car
const ConversationSchema = new Schema(
	{
		participants: [{ type: Schema.Types.ObjectId, ref: 'Member', required: true }], // always sorted
		propertyId: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
		lastMessage: { type: String, default: '' },
		lastSenderId: { type: Schema.Types.ObjectId, ref: 'Member' },
		lastMessageAt: { type: Date, default: Date.now, index: true },
		unread: { type: Map, of: Number, default: {} }, // memberId -> unread messages
	},
	{ timestamps: true, collection: 'conversations' },
);
ConversationSchema.index({ participants: 1, propertyId: 1 });

export default ConversationSchema;
