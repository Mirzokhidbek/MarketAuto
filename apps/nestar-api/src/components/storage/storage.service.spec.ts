import * as fs from 'fs';
import { StorageService } from './storage.service';

const connectionWith = (referenced: boolean) => {
	const findOne = jest.fn().mockResolvedValue(referenced ? { _id: 1 } : null);
	return { db: { collection: () => ({ findOne }) } } as any;
};

describe('StorageService', () => {
	const storage = new StorageService(connectionWith(false));

	it('accepts only files in our upload folder for the target', () => {
		expect(storage.isOwnPath('uploads/member/3f2c-9a.webp', 'member')).toBe(true);
		expect(storage.isOwnPath('uploads/property/3f2c-9a.webp', 'member')).toBe(false);
		expect(storage.isOwnPath('uploads/member/../property/x.webp', 'member')).toBe(false);
		expect(storage.isOwnPath('uploads/member/sub/x.webp', 'member')).toBe(false);
		expect(storage.isOwnPath('https://evil.example/x.webp', 'message')).toBe(false);
		expect(storage.isOwnPath(undefined, 'member')).toBe(false);
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
