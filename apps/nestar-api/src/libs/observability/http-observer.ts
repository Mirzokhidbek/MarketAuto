import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { settings } from '../env';
import { httpDuration, routeLabels } from './metrics';
import { RequestContext, graphqlOperation, httpRoute, requestContext, requestIdFrom } from './request-context';

const logger = new Logger('HTTP');
// polled every few seconds by Docker, the load balancer and Prometheus: measured, not logged
const QUIET_ROUTES = new Set(['health', 'metrics', 'uploads']);

interface Observed extends RequestContext {
	startedAt: bigint;
}

const observed = (res: Response): Observed | undefined => res.locals.observed as Observed | undefined;

/**
 * First middleware: gives the request an id (sent back as X-Request-Id, so a user or the mobile app can
 * report it) and measures the whole answer, from the first byte in to the last byte out.
 */
export const startRequest = (req: Request, res: Response, next: NextFunction): void => {
	const state: Observed = {
		requestId: requestIdFrom(req.headers['x-request-id']),
		route: req.path === '/graphql' ? 'graphql' : httpRoute(req.path),
		startedAt: process.hrtime.bigint(),
	};
	res.locals.observed = state;
	res.setHeader('X-Request-Id', state.requestId);
	res.on('finish', () => finishRequest(req, res, state));
	next();
};

/**
 * Last middleware before the routes (after the body parsers, which do not keep async context): from here on
 * every log line and metric knows the request id and the GraphQL operation.
 */
export const bindRequestContext = (req: Request, res: Response, next: NextFunction): void => {
	const state = observed(res);
	if (!state) return next();
	if (req.path === '/graphql' && req.method === 'POST') state.route = graphqlOperation(req.body);
	requestContext.run({ requestId: state.requestId, route: state.route }, next);
};

const finishRequest = (req: Request, res: Response, state: Observed): void => {
	if (state.route === 'metrics') return;
	const seconds = Number(process.hrtime.bigint() - state.startedAt) / 1e9;
	const route = routeLabels.of(state.route);
	httpDuration.observe({ method: req.method, route, status: String(res.statusCode) }, seconds);
	if (QUIET_ROUTES.has(state.route)) return;

	const ms = Math.round(seconds * 1000);
	requestContext.run({ requestId: state.requestId, route: state.route }, () => {
		const line = `${req.method} ${state.route} ${res.statusCode} ${ms}ms`;
		if (ms >= settings.slowRequestMs) logger.warn(`slow request: ${line}`);
		else logger.log(line);
	});
};
