import { getJwtToken, hasSession, isTokenExpired, refreshAccessToken } from './auth';
import { incomingMessageVar, notificationPingVar, socketVar, unreadMessagesVar, userVar } from '../apollo/store';

/**
 * One WebSocket per tab for live private messages and notifications. Connects only for logged-in members,
 * reconnects with a growing delay, and reconnects with the new token after login/refresh.
 * The token is sent as the first frame (not in the URL, where proxies would log it).
 */
// the server closes with 4401 for a rejected token and 4001 when the token expired
const CLOSE_UNAUTHORIZED = 4401;
let socket: WebSocket | null = null;
let socketToken = '';
let retry = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleReconnect = () => {
	if (retryTimer) return;
	const delay = Math.min(30000, 1000 * 2 ** retry++);
	retryTimer = setTimeout(() => {
		retryTimer = null;
		connectSocket();
	}, delay);
};

export const connectSocket = async (): Promise<void> => {
	if (typeof window === 'undefined' || !process.env.REACT_APP_API_WS) return;
	let token = getJwtToken();
	if (hasSession() && (!token || isTokenExpired(token))) token = (await refreshAccessToken()) ?? '';
	if (!token) return disconnectSocket();
	if (socket && socketToken === token && socket.readyState <= WebSocket.OPEN) return;

	disconnectSocket();
	socketToken = token;
	const current = new WebSocket(process.env.REACT_APP_API_WS);
	socket = current;
	socketVar(current);

	current.onopen = () => {
		retry = 0;
		current.send(JSON.stringify({ event: 'auth', data: { token } }));
	};
	current.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			// a new notification: the bell and the notification page reload their list
			if (data?.event === 'notification') return void notificationPingVar(notificationPingVar() + 1);
			if (data?.event !== 'privateMessage') return;
			incomingMessageVar(data);
			if (String(data.message?.senderId) !== String(userVar()._id)) unreadMessagesVar(unreadMessagesVar() + 1);
		} catch (err) {
			// ignore malformed frames
		}
	};
	current.onclose = (event) => {
		if (socket === current) socket = null;
		socketToken = '';
		// a rejected token is not retried in a loop: the next login/refresh reconnects
		if (event.code === CLOSE_UNAUTHORIZED) return;
		if (getJwtToken()) scheduleReconnect();
	};
};

export const disconnectSocket = () => {
	if (socket) {
		socket.onclose = null;
		socket.close();
		socket = null;
	}
	socketToken = '';
};
