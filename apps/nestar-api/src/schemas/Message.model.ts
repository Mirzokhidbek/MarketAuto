import { Schema } from 'mongoose';

const MessageSchema = new Schema(
	{
		conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
		senderId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
		text: { type: String, default: '', maxlength: 1000 },
		image: { type: String }, // optional photo (uploads/message/...)
		readAt: { type: Date },
	},
	{ timestamps: true, collection: 'messages' },
);

export default MessageSchema;
