import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { Message } from '../../libs/enums/common.enum';
import { uploadTargets } from '../../libs/config';

// longest side after resizing: avatars are small, car photos keep enough detail for the gallery
const MAX_SIZE: Record<string, number> = { member: 400, property: 1600, article: 1400, message: 1400 };

/**
 * Saves uploaded images as compressed WebP.
 * Local disk (uploads/<target>/...) by default; S3 / any S3-compatible storage when S3_BUCKET is set:
 *   S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, optional S3_ENDPOINT, S3_PUBLIC_URL (CDN/base URL)
 */
@Injectable()
export class StorageService {
	private readonly logger = new Logger('StorageService');
	private readonly s3: S3Client | null = process.env.S3_BUCKET
		? new S3Client({
				region: process.env.S3_REGION ?? 'us-east-1',
				endpoint: process.env.S3_ENDPOINT || undefined,
				forcePathStyle: !!process.env.S3_ENDPOINT,
				credentials: {
					accessKeyId: process.env.S3_ACCESS_KEY ?? '',
					secretAccessKey: process.env.S3_SECRET_KEY ?? '',
				},
		  })
		: null;

	private publicBase(): string {
		return (
			process.env.S3_PUBLIC_URL ??
			`https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION ?? 'us-east-1'}.amazonaws.com`
		).replace(/\/$/, '');
	}

	public async readStream(stream: NodeJS.ReadableStream): Promise<Buffer> {
		const chunks: Buffer[] = [];
		for await (const chunk of stream as any) chunks.push(Buffer.from(chunk));
		return Buffer.concat(chunks);
	}

	/** resizes + converts to WebP; returns a relative path (local) or an absolute URL (S3) */
	public async saveImage(input: Buffer, target: string): Promise<string> {
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

		const key = `${target}/${uuidv4()}.webp`;
		if (this.s3) {
			await this.s3.send(
				new PutObjectCommand({
					Bucket: process.env.S3_BUCKET,
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

	/** deletes an image that is no longer used; unknown or foreign paths are ignored */
	public async removeImage(image?: string | null): Promise<void> {
		if (!image) return;
		try {
			if (this.s3 && image.startsWith(this.publicBase() + '/')) {
				const key = image.slice(this.publicBase().length + 1);
				await this.s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
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
