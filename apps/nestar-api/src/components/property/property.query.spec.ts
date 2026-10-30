import { shapePropertyMatch } from './property.query';
import { T } from '../../libs/types/common';

describe('shapePropertyMatch', () => {
	it('adds only the filters that are set', () => {
		const match: T = { propertyStatus: 'ACTIVE' };
		shapePropertyMatch(match, { page: 1, limit: 10, search: {} });
		expect(match).toEqual({ propertyStatus: 'ACTIVE' });
	});

	it('turns lists into $in, ranges into $gte/$lte and options into required flags', () => {
		const match: T = {};
		shapePropertyMatch(match, {
			page: 1,
			limit: 10,
			search: {
				brandList: ['KIA'],
				typeList: [],
				pricesRange: { start: 5000, end: 9000 },
				options: ['propertyBarter'],
				noAccident: true,
			},
		} as any);
		expect(match).toEqual({
			carBrand: { $in: ['KIA'] },
			propertyPrice: { $gte: 5000, $lte: 9000 },
			propertyBarter: true,
			carAccidentHistory: 'NONE',
		});
	});

	it('escapes regex characters in free text', () => {
		const match: T = {};
		shapePropertyMatch(match, { page: 1, limit: 10, search: { text: 'K5 (2021)' } });
		expect((match.propertyTitle.$regex as RegExp).test('kia k5 (2021) gt')).toBe(true);
		expect((match.propertyTitle.$regex as RegExp).test('K5 2021')).toBe(false);
	});
});
