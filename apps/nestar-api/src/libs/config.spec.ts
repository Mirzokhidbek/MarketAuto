import { searchRegex, shapeIntoMongoObjectId } from './config';

describe('searchRegex', () => {
	it('matches user text literally and case-insensitively', () => {
		expect(searchRegex('kia (k5)').test('2021 KIA (K5) GT')).toBe(true);
		expect(searchRegex('a.c').test('abc')).toBe(false); // "." is not a wildcard
	});

	it('does not throw on special characters', () => {
		expect(() => searchRegex('(')).not.toThrow();
		expect(() => searchRegex('[*+?')).not.toThrow();
	});
});

describe('shapeIntoMongoObjectId', () => {
	it('converts valid ids and rejects malformed ones with 400', () => {
		expect(String(shapeIntoMongoObjectId('6add76ec6a7e39342755351a'))).toBe('6add76ec6a7e39342755351a');
		expect(() => shapeIntoMongoObjectId('not-an-id')).toThrow('Bad Request');
	});
});
