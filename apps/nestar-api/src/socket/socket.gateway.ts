import { idString } from '../libs/config';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import WebSocket, { Server } from 'ws';
import { AuthService } from '../components/auth/auth.service';
import { openSockets } from '../libs/observability/metrics';
import { instanceId, redisReady, redisSubscriber } from '../libs/redis';
import type Redis from 'ioredis';

// with several API instances a member's sockets can be on any of them: events go through this Redis channel
const EVENTS_CHANNEL = 'ws:events';

interface BusEvent {
	from: string;
	kind: 'emit' | 'disconnect';
	memberId: string;
	data?: string;
}

// a socket must say who it is within this time, otherwise it is closed
const AUTH_TIMEOUT_MS = 10 * 1000;
// dead connections (closed laptop, lost network) are found by ping/pong and dropped
const HEARTBEAT_MS = 30 * 1000;
// close codes the client understands: 4401 = not authenticated, 4001 = token expired (reconnect with a fresh one)
export const CLOSE_UNAUTHORIZED = 4401;
export const CLOSE_TOKEN_EXPIRED = 4001;

interface ClientState {
	memberId?: string;
	alive: boolean;
	timer?: ReturnType<typeof setTimeout>;
}

/**
 * Live delivery channel for private messages. A client connects without credentials and sends
 * {"event":"auth","data":{"token":"<accessToken>"}} as its first frame (the token is not put in the URL,
 * where proxies would log it). The socket is closed when the token expires or the member is blocked.
 */
@WebSocketGateway({ transports: ['websocket'], secure: false, maxPayload: 16 * 1024 })
export class SocketGateway implements OnGatewayInit, OnModuleDestroy {
	private logger: Logger = new Logger('SocketEventsGateway');
	// memberId -> open sockets (several tabs/devices)
	private memberSockets: Map<string, Set<WebSocket>> = new Map();
	private clients: Map<WebSocket, ClientState> = new Map();
	private heartbeat?: ReturnType<typeof setInterval>;
	private subscriber?: Redis;

	constructor(private readonly authService: AuthService) {}

	@WebSocketServer()
	server!: Server;

	public afterInit() {
		this.heartbeat = setInterval(() => this.checkAlive(), HEARTBEAT_MS);
		this.heartbeat.unref?.();
		this.subscribeToBus();
		this.logger.verbose('WebSocket Server Initialized');
	}

	public onModuleDestroy() {
		if (this.heartbeat) clearInterval(this.heartbeat);
		this.subscriber?.disconnect();
	}

	/** events published by the other API instances reach the sockets connected here */
	private subscribeToBus(): void {
		this.subscriber = redisSubscriber();
		if (!this.subscriber) return;
		this.subscriber.subscribe(EVENTS_CHANNEL).catch((error: Error) => this.logger.warn(`subscribe: ${error.message}`));
		this.subscriber.on('message', (_channel: string, raw: string) => {
			try {
				const event = JSON.parse(raw) as BusEvent;
				if (event.from === instanceId) return;
				if (event.kind === 'emit' && event.data) this.deliver(event.memberId, event.data);
				if (event.kind === 'disconnect') this.closeLocal(event.memberId);
			} catch {
				/* not ours */
			}
		});
	}

	private publish(event: Omit<BusEvent, 'from'>): void {
		const connection = redisReady();
		if (!connection) return;
		connection
			.publish(EVENTS_CHANNEL, JSON.stringify({ ...event, from: instanceId }))
			.catch((error: Error) => this.logger.warn(`publish: ${error.message}`));
	}

	public handleConnection(client: WebSocket) {
		const state: ClientState = { alive: true };
		state.timer = setTimeout(() => {
			if (!state.memberId) client.close(CLOSE_UNAUTHORIZED, 'auth timeout');
		}, AUTH_TIMEOUT_MS);
		this.clients.set(client, state);
		openSockets.set(this.clients.size);
		client.on('pong', () => (state.alive = true));
	}

	@SubscribeMessage('auth')
	public async handleAuth(@ConnectedSocket() client: WebSocket, @MessageBody() data: { token?: string }) {
		const state = this.clients.get(client);
		if (!state || state.memberId) return;
		try {
			const token = String(data?.token ?? '');
			const member = await this.authService.verifyToken(token);
			if (client.readyState !== WebSocket.OPEN) return;
			const memberId = idString(member._id);
			state.memberId = memberId;
			if (!this.memberSockets.has(memberId)) this.memberSockets.set(memberId, new Set());
			this.memberSockets.get(memberId)!.add(client);

			// the access token is short-lived: the client reconnects with a fresh one
			if (state.timer) clearTimeout(state.timer);
			const expiresAt = this.authService.tokenExpiresAt(token);
			const left = expiresAt ? expiresAt - Date.now() : 0;
			if (left > 0) state.timer = setTimeout(() => client.close(CLOSE_TOKEN_EXPIRED, 'token expired'), left);
			else client.close(CLOSE_TOKEN_EXPIRED, 'token expired');
		} catch (err) {
			client.close(CLOSE_UNAUTHORIZED, 'not authenticated');
		}
	}

	public handleDisconnect(client: WebSocket) {
		const state = this.clients.get(client);
		this.clients.delete(client);
		openSockets.set(this.clients.size);
		if (state?.timer) clearTimeout(state.timer);
		if (!state?.memberId) return;
		const sockets = this.memberSockets.get(state.memberId);
		sockets?.delete(client);
		if (sockets && !sockets.size) this.memberSockets.delete(state.memberId);
	}

	/** to every open socket of the member, on this instance and (through Redis) on the others */
	public emitToMember(memberId: string, payload: object): void {
		const data = JSON.stringify(payload);
		this.deliver(memberId, data);
		this.publish({ kind: 'emit', memberId, data });
	}

	/** blocked or deleted member: live delivery stops at once, on every instance */
	public disconnectMember(memberId: string): void {
		this.closeLocal(String(memberId));
		this.publish({ kind: 'disconnect', memberId: String(memberId) });
	}

	private deliver(memberId: string, data: string): void {
		this.memberSockets.get(memberId)?.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) client.send(data);
		});
	}

	private closeLocal(memberId: string): void {
		this.memberSockets.get(memberId)?.forEach((client) => client.close(CLOSE_UNAUTHORIZED, 'session ended'));
	}

	private checkAlive(): void {
		this.clients.forEach((state, client) => {
			if (!state.alive) return client.terminate();
			state.alive = false;
			client.ping();
		});
	}
}
