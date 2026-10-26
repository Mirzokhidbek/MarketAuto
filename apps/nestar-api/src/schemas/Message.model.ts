import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
		senderId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
		text: { type: String, required: true, maxlength: 1000 },
		readAt: { type: Date },
	},
	{ timestamps: true, collection: 'messages' },
);

export default MessageSchema;
