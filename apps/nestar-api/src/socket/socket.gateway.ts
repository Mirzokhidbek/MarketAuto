import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import WebSocket, { Server } from 'ws';
import * as url from 'url';
import { AuthService } from '../components/auth/auth.service';

/**
 * Live delivery channel. Logged-in members connect with ?token=<accessToken> and receive their
 * private messages instantly; there is no public chat room.
 */
@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	// memberId -> open sockets (several tabs/devices)
	private memberSockets: Map<string, Set<WebSocket>> = new Map();
	private socketMember: Map<WebSocket, string> = new Map();

	constructor(private readonly authService: AuthService) {}

	@WebSocketServer()
	server!: Server;

	public afterInit() {
		this.logger.verbose('WebSocket Server Initialized');
	}

	public async handleConnection(client: WebSocket, req: any) {
		try {
			const { token } = url.parse(req.url, true).query;
			const member = await this.authService.verifyToken(token as string);
			const memberId = String(member._id);
			this.socketMember.set(client, memberId);
			if (!this.memberSockets.has(memberId)) this.memberSockets.set(memberId, new Set());
			this.memberSockets.get(memberId)!.add(client);
		} catch (err) {
			// guests keep the socket open but receive nothing
		}
	}

	public handleDisconnect(client: WebSocket) {
		const memberId = this.socketMember.get(client);
		this.socketMember.delete(client);
		if (!memberId) return;
		const sockets = this.memberSockets.get(memberId);
		sockets?.delete(client);
		if (sockets && !sockets.size) this.memberSockets.delete(memberId);
	}

	public emitToMember(memberId: string, payload: object): void {
		const data = JSON.stringify(payload);
		this.memberSockets.get(memberId)?.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) client.send(data);
		});
	}
}
