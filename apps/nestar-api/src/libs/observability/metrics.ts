import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus metrics, served at GET /metrics. Grafana (or any Prometheus UI) then shows how long each
 * GraphQL operation and database command takes (p50/p95/p99), error rates, rate-limit blocks, cache hit
 * rate, open WebSockets and the process itself (memory, event loop lag, GC).
 */
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

const SECONDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

export const httpDuration = new Histogram({
	name: 'http_request_duration_seconds',
	help: 'Time to answer a request; route is the GraphQL operation name or a fixed route',
	labelNames: ['method', 'route', 'status'] as const,
	buckets: SECONDS,
	registers: [metricsRegistry],
});

export const graphqlErrors = new Counter({
	name: 'graphql_errors_total',
	help: 'GraphQL errors by operation and code',
	labelNames: ['route', 'code'] as const,
	registers: [metricsRegistry],
});

export const dbDuration = new Histogram({
	name: 'db_command_duration_seconds',
	help: 'MongoDB command time by collection and command',
	labelNames: ['collection', 'command', 'outcome'] as const,
	buckets: SECONDS,
	registers: [metricsRegistry],
});

export const rateLimitBlocks = new Counter({
	name: 'rate_limit_blocked_total',
	help: 'Requests refused by a rate limit',
	labelNames: ['limiter'] as const,
	registers: [metricsRegistry],
});

export const cacheLookups = new Counter({
	name: 'cache_lookups_total',
	help: 'Cache lookups by cache name and result',
	labelNames: ['cache', 'result'] as const,
	registers: [metricsRegistry],
});

export const openSockets = new Gauge({
	name: 'websocket_connections',
	help: 'Open WebSocket connections on this instance',
	registers: [metricsRegistry],
});

/**
 * Label values that come from requests (operation names) are client-controlled: after `max` distinct
 * values everything new is counted as "other", so a client inventing names cannot grow the metrics forever.
 */
export class BoundedLabels {
	private readonly seen = new Set<string>();

	constructor(private readonly max = 200) {}

	public of(value: string): string {
		if (this.seen.has(value)) return value;
		if (this.seen.size >= this.max) return 'other';
		this.seen.add(value);
		return value;
	}
}

export const routeLabels = new BoundedLabels();
