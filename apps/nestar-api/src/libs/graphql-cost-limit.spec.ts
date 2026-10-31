import { buildSchema, parse, validate } from 'graphql';
import { costLimit } from './graphql-cost-limit';

const schema = buildSchema(`
	type Car { id: String, title: String, price: Int, seller: Member }
	type Member { nick: String, phone: String }
	type Query { car(id: String): Car, me: Member }
`);

const errorsFor = (query: string, maxFields = 10, maxRoots = 3) =>
	validate(schema, parse(query), [costLimit(maxFields, maxRoots)]).map((error) => error.message);

describe('costLimit', () => {
	it('allows normal queries', () => {
		expect(errorsFor('{ car(id: "1") { id title seller { nick } } me { nick } }')).toEqual([]);
	});

	it('rejects one operation repeated under many aliases', () => {
		const aliases = [1, 2, 3, 4].map((n) => `c${n}: car(id: "${n}") { id }`).join(' ');
		expect(errorsFor(`{ ${aliases} }`)[0]).toMatch('Too many operations');
	});

	it('counts fragments every time they are used', () => {
		const query = `
			{ a: car(id: "1") { ...F } b: car(id: "2") { ...F } }
			fragment F on Car { id title price seller { nick phone } }`;
		// 2 roots + 2 x 6 fields = 14 > 10
		expect(errorsFor(query)[0]).toMatch('too many fields');
		expect(errorsFor(query, 20)).toEqual([]);
	});

	it('does not count introspection', () => {
		expect(errorsFor('{ __schema { types { name fields { name type { name } } } } }', 2)).toEqual([]);
	});
});
