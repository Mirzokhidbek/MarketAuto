import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { settings } from '../env';
import { currentRequest } from './request-context';

type JsonLogOptions = Parameters<ConsoleLogger['getJsonLogObject']>[1];

/**
 * Nest's console logger plus the request id of the request being served, so every line written while
 * answering one request can be found with one search. JSON lines in production (LOG_FORMAT=json|text).
 */
export class AppLogger extends ConsoleLogger {
	constructor() {
		super({ json: settings.jsonLogs, colors: !settings.jsonLogs, logLevels: AppLogger.levels() });
	}

	private static levels(): LogLevel[] {
		// "debug" and "verbose" only while developing
		return settings.production
			? ['fatal', 'error', 'warn', 'log']
			: ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];
	}

	protected getJsonLogObject(message: unknown, options: JsonLogOptions): ReturnType<ConsoleLogger['getJsonLogObject']> {
		const record = super.getJsonLogObject(message, options);
		const request = currentRequest();
		if (request) {
			record.requestId = request.requestId;
			record.route = request.route;
		}
		return record;
	}

	protected formatContext(context: string): string {
		const request = currentRequest();
		return super.formatContext(request ? `${context}] [${request.requestId.slice(0, 8)}` : context);
	}
}
