import { getJwtToken, getRefreshToken, isTokenExpired, refreshAccessToken } from './auth';
import { incomingMessageVar, socketVar, unreadMessagesVar, userVar } from '../apollo/store';

/**
 * One WebSocket per tab for live private messages. Connects only for logged-in members,
 * reconnects with a growing delay, and reconnects with the new token after login/refresh.
 */
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
	if (token && isTokenExpired(token) && getRefreshToken()) token = (await refreshAccessToken()) ?? '';
	if (!token) return disconnectSocket();
	if (socket && socketToken === token && socket.readyState <= WebSocket.OPEN) return;

	disconnectSocket();
	socketToken = token;
	socket = new WebSocket(`${process.env.REACT_APP_API_WS}?token=${encodeURIComponent(token)}`);
	socketVar(socket);

	socket.onopen = () => {
		retry = 0;
	};
	socket.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data?.event !== 'privateMessage') return;
			incomingMessageVar(data);
			if (String(data.message?.senderId) !== String(userVar()._id)) unreadMessagesVar(unreadMessagesVar() + 1);
		} catch (err) {
			// ignore malformed frames
		}
	};
	socket.onclose = () => {
		socket = null;
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
