import { BadRequestException } from '@nestjs/common';
import { SettingResolver } from './setting.resolver';

const setup = () => {
	const updateOne = jest.fn(() => ({ exec: () => Promise.resolve() }));
	const find = jest.fn(() => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }));
	const log = jest.fn(() => Promise.resolve());
	const resolver = new SettingResolver({ updateOne, find } as any, { log } as any);
	return { resolver, updateOne, log };
};

describe('SettingResolver.updateSiteSettings', () => {
	it('saves valid contacts', async () => {
		const { resolver, updateOne } = setup();
		await resolver.updateSiteSettings(
			{ supportPhone: '+998 71 200 00 00', supportEmail: 'help@marketauto.uz' },
			'a1' as any,
		);
		expect(updateOne).toHaveBeenCalledTimes(2);
	});

	it.each([
		[{ supportEmail: 'not-an-email' }],
		[{ supportPhone: 'call me' }],
		[{ telegramUrl: 'javascript:alert(1)' }],
	])('rejects %j', async (input) => {
		const { resolver, updateOne } = setup();
		await expect(resolver.updateSiteSettings(input, 'a1' as any)).rejects.toBeInstanceOf(BadRequestException);
		expect(updateOne).not.toHaveBeenCalled();
	});

	it('saves nothing when a later field is invalid', async () => {
		const { resolver, updateOne, log } = setup();
		await expect(
			resolver.updateSiteSettings({ supportPhone: '+998 71 200 00 00', supportEmail: 'broken' }, 'a1' as any),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(updateOne).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it('allows clearing a field', async () => {
		const { resolver, updateOne } = setup();
		await resolver.updateSiteSettings({ facebookUrl: '' }, 'a1' as any);
		expect(updateOne).toHaveBeenCalledWith({ key: 'facebookUrl' }, { key: 'facebookUrl', value: '' }, { upsert: true });
	});
});
