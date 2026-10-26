import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { MessageService } from './message.service';
import {
	ChatMessage,
	ChatMessages,
	Conversations,
	MessagesInquiry,
	SendMessageInput,
} from '../../libs/dto/message/message';
import { OrdinaryInquiry } from '../../libs/dto/property/property.input';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';

/** private buyer <-> seller messages (replaces the old public chat) */
@Resolver()
export class MessageResolver {
	constructor(private readonly messageService: MessageService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => ChatMessage)
	public async sendMessage(@Args('input') input: SendMessageInput, @AuthMember('_id') memberId: ObjectId): Promise<ChatMessage> {
		return await this.messageService.sendMessage(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Conversations)
	public async getConversations(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Conversations> {
		return await this.messageService.getConversations(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => ChatMessages)
	public async getMessages(@Args('input') input: MessagesInquiry, @AuthMember('_id') memberId: ObjectId): Promise<ChatMessages> {
		return await this.messageService.getMessages(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Int)
	public async getUnreadMessagesCount(@AuthMember('_id') memberId: ObjectId): Promise<number> {
		return await this.messageService.getUnreadMessagesCount(memberId);
	}
}
