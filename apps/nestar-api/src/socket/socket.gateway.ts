import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import WebSocket, { Server } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lookupMember } from '../libs/config';

const HISTORY_SIZE = 30;
const MAX_MESSAGE_LENGTH = 500;

// only public profile fields are ever sent to other chat clients (no phone, address, etc.)
type ChatMember = Pick<Member, '_id' | 'memberNick' | 'memberFullName' | 'memberImage' | 'memberType'>;
const toChatMember = (member?: Member | null): ChatMember | null =>
	member
		? {
				_id: member._id,
				memberNick: member.memberNick,
				memberFullName: member.memberFullName,
				memberImage: member.memberImage,
				memberType: member.memberType,
		  }
		: null;

interface MessagePayload {
	event: string;
	text: string;
	memberData?: ChatMember | null;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData?: ChatMember | null;
	action: string;
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient: number = 0;
	private clientsAuthMap: Map<WebSocket, Member | null> = new Map();
	constructor(
		private readonly authService: AuthService,
		@InjectModel('ChatMessage') private readonly chatMessageModel: Model<any>,
	) {}

	private async getHistory(): Promise<MessagePayload[]> {
		const messages = await this.chatMessageModel
			.aggregate([{ $sort: { createdAt: -1 } }, { $limit: HISTORY_SIZE }, lookupMember, { $sort: { createdAt: 1 } }])
			.exec();
		return messages.map((ele: any) => ({ event: 'message', text: ele.text, memberData: toChatMember(ele.memberData?.[0]) }));
	}

	@WebSocketServer()
	server!: Server;
	public afterInit(server: Server) {
		this.logger.verbose(`WebSocket Server Initialized total: ${this.summaryClient}`);
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;

			return await this.authService.verifyToken(token as string);
		} catch (err: any) {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: any) {
		const authMember = await this.retrieveAuth(req);
		this.summaryClient++;
		this.clientsAuthMap.set(client, authMember);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Connection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: toChatMember(authMember),
			action: 'joined',
		};
		this.emitMessage(infoMsg);
		// CLIENT MESSAGES
		client.send(JSON.stringify({ event: 'getMessages', list: await this.getHistory() }));
	}

	public handleDisconnect(client: WebSocket) {
		const authMember = this.clientsAuthMap.get(client);
		this.summaryClient--;
		this.clientsAuthMap.delete(client);

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`Disconnection [${clientNick}] & total [${this.summaryClient}]`);

		const infoMsg: InfoPayload = {
			event: 'info',
			totalClients: this.summaryClient,
			memberData: toChatMember(authMember),
			action: 'left',
		};
		this.broadcastMessage(client, infoMsg);
	}

	@SubscribeMessage('message')
	public async handleMessage(client: WebSocket, payload: string): Promise<void> {
		if (typeof payload !== 'string' || !payload.trim()) return;
		const text = payload.trim().slice(0, MAX_MESSAGE_LENGTH);

		const authMember = this.clientsAuthMap.get(client);
		const newMessage: MessagePayload = { event: 'message', text, memberData: toChatMember(authMember) };

		const clientNick: string = authMember?.memberNick ?? 'Guest';
		this.logger.verbose(`NEW MESSAGE: [${clientNick}]: ${text}`);

		await this.chatMessageModel.create({ text, memberId: authMember?._id });
		this.emitMessage(newMessage);
	}

	private broadcastMessage(sender: WebSocket, message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client !== sender && client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}

	private emitMessage(message: InfoPayload | MessagePayload) {
		this.server.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(message));
			}
		});
	}
}

/*
	MESSAGE TARGET:
	1. Client (only client)
	2. Broadcast (except client)
  3. Emit (all clients)
*/
