import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface RequestContext {
	requestId: string;
	/** GraphQL operation ("getProperties") or route ("health"); the metric and log label */
	route: string;
}

/** the request being served right now, visible from any service or log call without passing it around */
export const requestContext = new AsyncLocalStorage<RequestContext>();

export const currentRequest = (): RequestContext | undefined => requestContext.getStore();

// a request id from nginx or a mobile app is kept (one id across the whole chain), anything odd is replaced
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

export const requestIdFrom = (header: unknown): string =>
	typeof header === 'string' && VALID_REQUEST_ID.test(header) ? header : randomUUID();

const OPERATION_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

/**
 * The name a GraphQL request is measured under: the client's operationName, else the first field of an
 * anonymous query ("{ getMe { _id } }" -> "getMe"). Never the variables.
 */
export const graphqlOperation = (body: unknown): string => {
	const { operationName, query } = (body ?? {}) as { operationName?: unknown; query?: unknown };
	if (typeof operationName === 'string' && OPERATION_NAME.test(operationName)) return operationName;
	if (typeof query !== 'string') return 'unknown';
	const named = /^\s*(?:query|mutation|subscription)\s+([A-Za-z_][A-Za-z0-9_]{0,63})/.exec(query);
	if (named) return named[1];
	const field =
		/^\s*(?:query|mutation|subscription)?\s*(?:\([^)]*\))?\s*\{\s*(?:[A-Za-z_]\w*\s*:\s*)?([A-Za-z_]\w{0,63})/.exec(
			query,
		);
	return field ? field[1] : 'unknown';
};

/** the route label of a non-GraphQL request: a few fixed names, so the metrics never grow with the URLs */
export const httpRoute = (path: string): string => {
	if (path === '/' || path === '') return 'root';
	if (path === '/health' || path === '/metrics') return path.slice(1);
	if (path.startsWith('/uploads/')) return 'uploads';
	return 'other';
};
