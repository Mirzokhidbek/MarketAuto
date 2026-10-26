import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import {
	ChatMessage,
	ChatMessages,
	Conversation,
	Conversations,
	MessagesInquiry,
	SendMessageInput,
} from '../../libs/dto/message/message';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { Message } from '../../libs/enums/common.enum';
import { MemberStatus } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { limiters } from '../../libs/rate-limiter';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class MessageService {
	constructor(
		@InjectModel('Conversation') private readonly conversationModel: Model<any>,
		@InjectModel('Message') private readonly messageModel: Model<any>,
		@InjectModel('Member') private readonly memberModel: Model<any>,
		private readonly socketGateway: SocketGateway,
	) {}

	public async sendMessage(senderId: ObjectId, input: SendMessageInput): Promise<ChatMessage> {
		limiters.messages.consume(String(senderId));
		const receiverId = shapeIntoMongoObjectId(input.receiverId);
		if (String(receiverId) === String(senderId)) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);
		const receiver = await this.memberModel.exists({ _id: receiverId, memberStatus: MemberStatus.ACTIVE });
		if (!receiver) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const participants = [senderId, receiverId].map(String).sort().map((id) => new Types.ObjectId(id));
		const propertyId = input.propertyId ? shapeIntoMongoObjectId(input.propertyId) : null;
		const text = input.text.trim();
		if (!text) throw new BadRequestException(Message.BAD_REQUEST);

		const conversation = await this.conversationModel
			.findOneAndUpdate(
				{ participants, propertyId },
				{
					$setOnInsert: { participants, propertyId },
					$set: { lastMessage: text.slice(0, 200), lastSenderId: senderId, lastMessageAt: new Date() },
					$inc: { [`unread.${String(receiverId)}`]: 1 },
				},
				{ upsert: true, new: true },
			)
			.exec();

		const message = await this.messageModel.create({ conversationId: conversation._id, senderId, text });
		// live delivery to every open tab of the receiver (and the sender's other tabs)
		const payload = { event: 'privateMessage', conversationId: String(conversation._id), message: message.toObject() };
		this.socketGateway.emitToMember(String(receiverId), payload);
		this.socketGateway.emitToMember(String(senderId), payload);
		return message;
	}

	public async getConversations(memberId: ObjectId, input: OrdinaryInquiry): Promise<Conversations> {
		const me = new Types.ObjectId(String(memberId));
		const [result] = await this.conversationModel
			.aggregate([
				{ $match: { participants: me } },
				{ $sort: { lastMessageAt: -1 } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							{
								$addFields: {
									otherId: { $first: { $filter: { input: '$participants', cond: { $ne: ['$$this', me] } } } },
									unreadCount: { $ifNull: [{ $getField: { field: String(me), input: '$unread' } }, 0] },
								},
							},
							{ $lookup: { from: 'members', localField: 'otherId', foreignField: '_id', as: 'otherMember' } },
							{ $unwind: { path: '$otherMember', preserveNullAndEmptyArrays: true } },
							{ $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'propertyData' } },
							{ $unwind: { path: '$propertyData', preserveNullAndEmptyArrays: true } },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		return result as Conversations;
	}

	/** messages newest first; opening a dialog marks it as read */
	public async getMessages(memberId: ObjectId, input: MessagesInquiry): Promise<ChatMessages> {
		const conversationId = shapeIntoMongoObjectId(input.conversationId);
		const conversation = await this.conversationModel.findById(conversationId).exec();
		if (!conversation || !conversation.participants.some((id: any) => String(id) === String(memberId)))
			throw new ForbiddenException(Message.NOT_PARTICIPANT);

		const [result] = await this.messageModel
			.aggregate([
				{ $match: { conversationId } },
				{ $sort: { createdAt: -1 } },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		await this.conversationModel.updateOne({ _id: conversationId }, { $set: { [`unread.${String(memberId)}`]: 0 } }).exec();
		await this.messageModel
			.updateMany({ conversationId, senderId: { $ne: memberId }, readAt: null }, { readAt: new Date() })
			.exec();
		return result as ChatMessages;
	}

	public async getUnreadMessagesCount(memberId: ObjectId): Promise<number> {
		const key = String(memberId);
		const [result] = await this.conversationModel
			.aggregate([
				{ $match: { participants: new Types.ObjectId(key), [`unread.${key}`]: { $gt: 0 } } },
				{ $group: { _id: null, total: { $sum: `$unread.${key}` } } },
			])
			.exec();
		return result?.total ?? 0;
	}
}
