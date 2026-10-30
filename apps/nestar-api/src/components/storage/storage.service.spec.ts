import * as fs from 'fs';
import { StorageService } from './storage.service';

const connectionWith = (referenced: boolean) => {
	const findOne = jest.fn().mockResolvedValue(referenced ? { _id: 1 } : null);
	return { db: { collection: () => ({ findOne }) } } as any;
};

describe('StorageService', () => {
	const storage = new StorageService(connectionWith(false));

	const OWNER = '64b7f0c2a1b2c3d4e5f60718';
	const OTHER = '64b7f0c2a1b2c3d4e5f60799';

	it("accepts only the owner's files in our upload folder for the target", () => {
		expect(storage.isOwnPath(`uploads/member/${OWNER}_3f2c-9a.webp`, 'member', OWNER)).toBe(true);
		expect(storage.isOwnPath(`uploads/member/${OTHER}_3f2c-9a.webp`, 'member', OWNER)).toBe(false);
		expect(storage.isOwnPath('uploads/member/3f2c-9a.webp', 'member', OWNER)).toBe(false); // no owner in the name
		expect(storage.isOwnPath(`uploads/property/${OWNER}_3f2c-9a.webp`, 'member', OWNER)).toBe(false);
		expect(storage.isOwnPath(`uploads/member/../property/${OWNER}_x.webp`, 'member', OWNER)).toBe(false);
		expect(storage.isOwnPath(`uploads/member/sub/${OWNER}_x.webp`, 'member', OWNER)).toBe(false);
		expect(storage.isOwnPath(`https://evil.example/${OWNER}_x.webp`, 'message', OWNER)).toBe(false);
		expect(storage.isOwnPath(undefined, 'member', OWNER)).toBe(false);
		expect(storage.isOwnPath(`uploads/member/${OWNER}_x.webp`, 'member', undefined)).toBe(false);
	});

	it('names stored files after the uploader', async () => {
		const write = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
		const mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
			'base64',
		);
		const saved = await storage.saveImage(png, 'property', OWNER);
		expect(saved).toMatch(new RegExp(`^uploads/property/${OWNER}_[0-9a-f-]+\\.webp$`));
		expect(storage.isOwnPath(saved, 'property', OWNER)).toBe(true);
		await expect(storage.saveImage(png, 'property', 'not-an-id')).rejects.toThrow();
		write.mockRestore();
		mkdir.mockRestore();
	});

	it('does not delete a file that another document still uses', async () => {
		const unlink = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();
		await new StorageService(connectionWith(true)).removeImage('uploads/property/victim.webp');
		expect(unlink).not.toHaveBeenCalled();

		await new StorageService(connectionWith(false)).removeImage('uploads/property/unused.webp');
		expect(unlink).toHaveBeenCalledWith('uploads/property/unused.webp');
		unlink.mockRestore();
	});

	it('never deletes outside the upload folders', async () => {
		const unlink = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();
		await storage.removeImage('../../etc/passwd');
		await storage.removeImage('uploads/../package.json');
		expect(unlink).not.toHaveBeenCalled();
		unlink.mockRestore();
	});
});
