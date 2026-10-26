import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import ConversationSchema from '../../schemas/Conversation.model';
import MessageSchema from '../../schemas/Message.model';
import MemberSchema from '../../schemas/Member.model';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../../socket/socket.module';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Conversation', schema: ConversationSchema },
			{ name: 'Message', schema: MessageSchema },
			{ name: 'Member', schema: MemberSchema },
		]),
		AuthModule,
		SocketModule,
	],
	providers: [MessageService, MessageResolver],
})
export class MessageModule {}
