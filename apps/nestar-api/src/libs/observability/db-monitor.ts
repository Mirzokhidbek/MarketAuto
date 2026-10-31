import { Logger } from '@nestjs/common';
import type { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent, MongoClient } from 'mongodb';
import { settings } from '../env';
import { dbDuration } from './metrics';

const logger = new Logger('Database');

// handshakes, heartbeats and auth: not queries
const IGNORED = new Set([
	'hello',
	'isMaster',
	'ismaster',
	'ping',
	'saslStart',
	'saslContinue',
	'endSessions',
	'buildInfo',
]);
// getMore names its collection in a separate field (its first value is the cursor id)
const getMoreCollection = (command: Record<string, unknown>): string =>
	typeof command.collection === 'string' ? command.collection : '-';

interface Started {
	collection: string;
	command: string;
	shape: string;
}

/**
 * The shape of a query without its values (they hold phones, emails, ids): "filter {memberId,propertyStatus}
 * sort {createdAt}" or "pipeline $match,$lookup,$facet". Enough to see which index a slow query needs.
 */
export const queryShape = (command: Record<string, unknown>): string => {
	const keys = (value: unknown) =>
		value && typeof value === 'object' && !Array.isArray(value) ? `{${Object.keys(value).join(',')}}` : '';
	const parts: string[] = [];
	if (command.filter) parts.push(`filter ${keys(command.filter)}`);
	if (command.query) parts.push(`filter ${keys(command.query)}`);
	if (command.sort) parts.push(`sort ${keys(command.sort)}`);
	if (Array.isArray(command.pipeline))
		parts.push(`pipeline ${command.pipeline.map((stage) => Object.keys(stage ?? {})[0]).join(',')}`);
	if (Array.isArray(command.updates)) parts.push(`update ${keys((command.updates[0] as { q?: unknown })?.q)}`);
	return parts.join(' ');
};

/**
 * Times every MongoDB command (needs the connection option monitorCommands: true): a histogram per
 * collection and command for Prometheus, and a warning with the query shape for slow ones.
 */
export const watchDatabase = (client: MongoClient): void => {
	const started = new Map<number, Started>();

	client.on('commandStarted', (event: CommandStartedEvent) => {
		if (IGNORED.has(event.commandName)) return;
		// a lost "finished" event must not leak memory
		if (started.size > 10_000) started.clear();
		const target = event.command[event.commandName];
		started.set(event.requestId, {
			collection: typeof target === 'string' ? target : getMoreCollection(event.command),
			command: event.commandName,
			shape: queryShape(event.command),
		});
	});

	const finished = (event: CommandSucceededEvent | CommandFailedEvent, outcome: 'ok' | 'error') => {
		const info = started.get(event.requestId);
		if (!info) return;
		started.delete(event.requestId);
		dbDuration.observe({ collection: info.collection, command: info.command, outcome }, event.duration / 1000);
		if (event.duration >= settings.slowQueryMs)
			logger.warn(`slow query: ${info.command} ${info.collection} ${Math.round(event.duration)}ms ${info.shape}`);
	};

	client.on('commandSucceeded', (event: CommandSucceededEvent) => finished(event, 'ok'));
	client.on('commandFailed', (event: CommandFailedEvent) => finished(event, 'error'));
};
