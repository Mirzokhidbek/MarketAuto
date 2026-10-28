import { CLOSE_TOKEN_EXPIRED, CLOSE_UNAUTHORIZED, SocketGateway } from './socket.gateway';

const fakeClient = () =>
	({ readyState: 1, close: jest.fn(), on: jest.fn(), send: jest.fn(), ping: jest.fn(), terminate: jest.fn() }) as any;

describe('SocketGateway', () => {
	afterEach(() => jest.useRealTimers());

	it('delivers messages only after a valid auth frame', async () => {
		const auth = { verifyToken: jest.fn().mockResolvedValue({ _id: 'm1' }), tokenExpiresAt: () => Date.now() + 60_000 };
		const gateway = new SocketGateway(auth as any);
		const client = fakeClient();
		gateway.handleConnection(client);

		gateway.emitToMember('m1', { event: 'x' });
		expect(client.send).not.toHaveBeenCalled();

		await gateway.handleAuth(client, { token: 't' });
		gateway.emitToMember('m1', { event: 'x' });
		expect(client.send).toHaveBeenCalledTimes(1);
		gateway.handleDisconnect(client);
	});

	it('closes sockets with a bad token, without auth, or when the token expires', async () => {
		jest.useFakeTimers();
		const bad = new SocketGateway({ verifyToken: jest.fn().mockRejectedValue(new Error('no')) } as any);
		const rejected = fakeClient();
		bad.handleConnection(rejected);
		await bad.handleAuth(rejected, { token: 'bad' });
		expect(rejected.close).toHaveBeenCalledWith(CLOSE_UNAUTHORIZED, expect.any(String));

		const silent = fakeClient();
		bad.handleConnection(silent);
		jest.advanceTimersByTime(10_001);
		expect(silent.close).toHaveBeenCalledWith(CLOSE_UNAUTHORIZED, 'auth timeout');

		const auth = { verifyToken: jest.fn().mockResolvedValue({ _id: 'm1' }), tokenExpiresAt: () => Date.now() + 5_000 };
		const gateway = new SocketGateway(auth as any);
		const client = fakeClient();
		gateway.handleConnection(client);
		await gateway.handleAuth(client, { token: 't' });
		jest.advanceTimersByTime(5_001);
		expect(client.close).toHaveBeenCalledWith(CLOSE_TOKEN_EXPIRED, 'token expired');
	});

	it('disconnects a blocked member', async () => {
		const gateway = new SocketGateway({
			verifyToken: jest.fn().mockResolvedValue({ _id: 'm1' }),
			tokenExpiresAt: () => Date.now() + 60_000,
		} as any);
		const client = fakeClient();
		gateway.handleConnection(client);
		await gateway.handleAuth(client, { token: 't' });
		gateway.disconnectMember('m1');
		expect(client.close).toHaveBeenCalledWith(CLOSE_UNAUTHORIZED, 'session ended');
		gateway.handleDisconnect(client);
	});
});
