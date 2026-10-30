import { settings } from '../../libs/env';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { Message } from '../../libs/enums/common.enum';
import { uploadTargets, idString } from '../../libs/config';

// longest side after resizing: avatars are small, car photos keep enough detail for the gallery
const MAX_SIZE: Record<string, number> = { member: 400, property: 1600, article: 1400, message: 1400 };
// a stored file name: no folders, no "..", e.g. 3f2c...-9a.webp
const FILE_NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
// uploader id in the file name: a Mongo ObjectId
const OWNER_ID = /^[a-f0-9]{24}$/;
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Saves uploaded images as compressed WebP.
 * Local disk (uploads/<target>/...) by default; S3 / any S3-compatible storage when S3_BUCKET is set:
 *   S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, optional S3_ENDPOINT, S3_PUBLIC_URL (CDN/base URL)
 */
@Injectable()
export class StorageService {
	private readonly logger = new Logger('StorageService');
	constructor(@InjectConnection() private readonly connection: Connection) {}

	private readonly s3: S3Client | null = settings.s3.bucket
		? new S3Client({
				region: settings.s3.region,
				endpoint: settings.s3.endpoint,
				forcePathStyle: !!settings.s3.endpoint,
				credentials: { accessKeyId: settings.s3.accessKey, secretAccessKey: settings.s3.secretKey },
			})
		: null;

	private publicBase(): string {
		return settings.s3.publicUrl.replace(/\/$/, '');
	}

	public async readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
		const chunks: Buffer[] = [];
		for await (const chunk of stream as any) chunks.push(Buffer.from(chunk));
		return Buffer.concat(chunks);
	}

	/**
	 * resizes + converts to WebP; returns a relative path (local) or an absolute URL (S3).
	 * The file name starts with the uploader's id ("<ownerId>_<uuid>.webp") so a listing, avatar, article or
	 * message can only use photos its author uploaded (see isOwnPath).
	 */
	public async saveImage(input: Buffer, target: string, ownerId: unknown): Promise<string> {
		if (!uploadTargets.includes(target)) throw new BadRequestException(Message.INVALID_UPLOAD_TARGET);
		let output: Buffer;
		try {
			const size = MAX_SIZE[target] ?? 1600;
			output = await sharp(input)
				.rotate() // respect phone EXIF orientation
				.resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();
		} catch (err) {
			throw new BadRequestException(Message.PROVIDE_ALLOWED_FORMAT);
		}

		const owner = idString(ownerId);
		if (!OWNER_ID.test(owner)) throw new BadRequestException(Message.UPLOAD_FAILED);
		const key = `${target}/${owner}_${randomUUID()}.webp`;
		if (this.s3) {
			await this.s3.send(
				new PutObjectCommand({
					Bucket: settings.s3.bucket,
					Key: key,
					Body: output,
					ContentType: 'image/webp',
					CacheControl: 'public, max-age=31536000, immutable',
				}),
			);
			return `${this.publicBase()}/${key}`;
		}

		const filePath = path.join('uploads', key);
		await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
		await fs.promises.writeFile(filePath, output);
		return filePath.split(path.sep).join('/');
	}

	/**
	 * true when the value points to a file that `ownerId` uploaded to our storage folder for this target
	 * ("uploads/property/<ownerId>_<uuid>.webp" or "<S3 base>/property/<ownerId>_<uuid>.webp").
	 * Member input must pass this check, so nobody can attach another member's photo (or an outside URL).
	 */
	public isOwnPath(image: unknown, target: string, ownerId: unknown): boolean {
		if (typeof image !== 'string' || !uploadTargets.includes(target)) return false;
		const owner = idString(ownerId);
		if (!OWNER_ID.test(owner)) return false;
		const local = `uploads/${target}/`;
		const remote = this.s3 ? `${this.publicBase()}/${target}/` : null;
		const base = image.startsWith(local) ? local : remote && image.startsWith(remote) ? remote : null;
		if (!base) return false;
		const name = image.slice(base.length);
		return FILE_NAME.test(name) && name.startsWith(`${owner}_`);
	}

	/** some member, listing, message or article still shows this image */
	private async isReferenced(image: string): Promise<boolean> {
		const db = this.connection.db;
		if (!db) return true;
		const found = await Promise.all([
			db.collection('members').findOne({ memberImage: image }, { projection: { _id: 1 } }),
			db.collection('properties').findOne({ propertyImages: image }, { projection: { _id: 1 } }),
			db.collection('messages').findOne({ image }, { projection: { _id: 1 } }),
			db
				.collection('boardArticles')
				.findOne(
					{ $or: [{ articleImage: image }, { articleContent: { $regex: escapeRegex(image) } }] },
					{ projection: { _id: 1 } },
				),
		]);
		return found.some(Boolean);
	}

	/**
	 * deletes an image that is no longer used; unknown or foreign paths are ignored, and so are files
	 * that another document still points to (a member could put someone else's photo path into their own data)
	 */
	public async removeImage(image?: string | null): Promise<void> {
		if (!image) return;
		try {
			if (await this.isReferenced(image)) return;
			if (this.s3 && image.startsWith(this.publicBase() + '/')) {
				const key = image.slice(this.publicBase().length + 1);
				await this.s3.send(new DeleteObjectCommand({ Bucket: settings.s3.bucket, Key: key }));
				return;
			}
			const normalized = path.normalize(image);
			// only files inside uploads/<target>/ may be deleted
			if (!uploadTargets.some((target) => normalized.startsWith(path.join('uploads', target) + path.sep))) return;
			await fs.promises.unlink(normalized);
		} catch (err: any) {
			if (err?.code !== 'ENOENT') this.logger.warn(`Could not delete ${image}: ${err.message}`);
		}
	}

	public async removeImages(images: (string | undefined | null)[]): Promise<void> {
		await Promise.all(images.map((image) => this.removeImage(image)));
	}
}
