import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { Property } from '../property/property';

@ObjectType()
export class ChatMessage {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => String)
	conversationId!: ObjectId;

	@Field(() => String)
	senderId!: ObjectId;

	@Field(() => String)
	text!: string;

	@Field(() => Date, { nullable: true })
	readAt?: Date;

	@Field(() => Date)
	createdAt!: Date;
}

@ObjectType()
export class ChatMessages {
	@Field(() => [ChatMessage])
	list!: ChatMessage[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}

@ObjectType()
export class Conversation {
	@Field(() => String)
	_id!: ObjectId;

	@Field(() => String, { nullable: true })
	propertyId?: ObjectId;

	@Field(() => String)
	lastMessage!: string;

	@Field(() => String, { nullable: true })
	lastSenderId?: ObjectId;

	@Field(() => Date)
	lastMessageAt!: Date;

	@Field(() => Int)
	unreadCount!: number;

	@Field(() => Member, { nullable: true })
	otherMember?: Member;

	@Field(() => Property, { nullable: true })
	propertyData?: Property;
}

@ObjectType()
export class Conversations {
	@Field(() => [Conversation])
	list!: Conversation[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter!: TotalCounter[];
}

@InputType()
export class SendMessageInput {
	@IsNotEmpty()
	@Field(() => String)
	receiverId!: string;

	/** the car the buyer asks about (first message from a listing page) */
	@IsOptional()
	@Field(() => String, { nullable: true })
	propertyId?: string;

	@IsNotEmpty()
	@Length(1, 1000)
	@Field(() => String)
	text!: string;
}

@InputType()
export class MessagesInquiry {
	@IsNotEmpty()
	@Field(() => String)
	conversationId!: string;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page!: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit!: number;
}
