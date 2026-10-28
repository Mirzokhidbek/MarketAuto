import { buildSchema, parse, validate } from 'graphql';
import { depthLimit } from './graphql-depth-limit';

const schema = buildSchema(`
	type Member { nick: String, followers: [Member] }
	type Query { member: Member }
`);

const errorsFor = (query: string, max = 3) =>
	validate(schema, parse(query), [depthLimit(max)]).map((error) => error.message);

describe('depthLimit', () => {
	it('allows queries within the limit', () => {
		expect(errorsFor('{ member { followers { nick } } }')).toEqual([]);
	});

	it('rejects deeper queries, also through fragments', () => {
		expect(errorsFor('{ member { followers { followers { nick } } } }')[0]).toMatch('too deep');
		expect(errorsFor('{ member { ...F } } fragment F on Member { followers { followers { nick } } }')[0]).toMatch(
			'too deep',
		);
	});

	it('does not count introspection fields', () => {
		expect(errorsFor('{ __schema { types { fields { type { ofType { ofType { name } } } } } } }')).toEqual([]);
	});
});
