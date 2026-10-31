import { graphqlOperation, httpRoute, requestIdFrom } from './request-context';
import { BoundedLabels } from './metrics';
import { queryShape } from './db-monitor';

describe('graphqlOperation', () => {
	it('uses the operation name, else the first field', () => {
		expect(graphqlOperation({ operationName: 'GetProperties', query: 'query GetProperties { x }' })).toBe(
			'GetProperties',
		);
		expect(graphqlOperation({ query: 'mutation Login($i: LoginInput!) { login(input: $i) { _id } }' })).toBe('Login');
		expect(graphqlOperation({ query: '{ getMe { _id } }' })).toBe('getMe');
		expect(graphqlOperation({ query: 'query ($id: String!) { a: getProperty(propertyId: $id) { _id } }' })).toBe(
			'getProperty',
		);
	});

	it('never takes odd names or variables', () => {
		expect(graphqlOperation({ operationName: 'x"; DROP', query: '{ getMe { _id } }' })).toBe('getMe');
		expect(graphqlOperation({ variables: { password: 'secret' } })).toBe('unknown');
		expect(graphqlOperation(undefined)).toBe('unknown');
	});
});

describe('request ids and routes', () => {
	it('keeps a sane incoming id and replaces anything else', () => {
		expect(requestIdFrom('nginx-1234abcd')).toBe('nginx-1234abcd');
		expect(requestIdFrom('bad id with spaces')).toMatch(/^[0-9a-f-]{36}$/);
		expect(requestIdFrom(undefined)).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('maps paths to a few fixed labels', () => {
		expect(httpRoute('/health')).toBe('health');
		expect(httpRoute('/uploads/property/a.webp')).toBe('uploads');
		expect(httpRoute('/wp-login.php')).toBe('other');
	});
});

describe('BoundedLabels', () => {
	it('counts new names as "other" after the limit', () => {
		const labels = new BoundedLabels(2);
		expect(labels.of('a')).toBe('a');
		expect(labels.of('b')).toBe('b');
		expect(labels.of('c')).toBe('other');
		expect(labels.of('a')).toBe('a');
	});
});

describe('queryShape', () => {
	it('shows the fields of a query without their values', () => {
		const shape = queryShape({
			find: 'members',
			filter: { memberPhone: '998901234567', memberStatus: 'ACTIVE' },
			sort: { createdAt: -1 },
		});
		expect(shape).toBe('filter {memberPhone,memberStatus} sort {createdAt}');
		expect(shape).not.toContain('998901234567');
		expect(queryShape({ aggregate: 'properties', pipeline: [{ $match: { a: 1 } }, { $sort: { b: 1 } }] })).toBe(
			'pipeline $match,$sort',
		);
	});
});
