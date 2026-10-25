import { Schema } from 'mongoose';

// public chat history; survives server restarts
const ChatMessageSchema = new Schema(
	{
		text: {
			type: String,
			required: true,
			maxlength: 500,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'chatMessages' },
);

export default ChatMessageSchema;
