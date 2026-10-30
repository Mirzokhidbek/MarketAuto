import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../nestar-api/src/libs/dto/member/member';
import { Property } from '../../nestar-api/src/libs/dto/property/property';
import { MemberStatus, MemberType } from '../../nestar-api/src/libs/enums/member.enum';
import { PropertyStatus } from '../../nestar-api/src/libs/enums/property.enum';

// files checked against the database per query
const CLEAN_CHUNK = 200;

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
		@InjectModel('Message') private readonly messageModel: Model<any>,
	) {}

	/**
	 * Deletes uploaded images nobody uses any more (abandoned "add car" forms, replaced avatars missed by the API).
	 * Only local uploads/ files older than one day are touched; S3 objects are managed by the API.
	 * Files are checked against the database in small groups, so memory does not grow with the number of images.
	 */
	public async batchCleanUploads(): Promise<number> {
		const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
		let removed = 0;
		for (const target of ['property', 'member', 'article', 'message']) {
			const dir = path.join('uploads', target);
			if (!fs.existsSync(dir)) continue;
			const files = await fs.promises.readdir(dir);
			for (let i = 0; i < files.length; i += CLEAN_CHUNK) {
				const old: string[] = [];
				for (const file of files.slice(i, i + CLEAN_CHUNK)) {
					const stat = await fs.promises.stat(path.join(dir, file));
					// a newer file may belong to a form being filled right now
					if (stat.isFile() && stat.mtimeMs <= dayAgo) old.push(`uploads/${target}/${file}`);
				}
				if (!old.length) continue;
				const used = await this.usedImages(old);
				for (const relative of old) {
					if (used.has(relative)) continue;
					await fs.promises.unlink(relative);
					removed++;
				}
			}
		}
		return removed;
	}

	/** which of these paths some member, car, message or article still uses */
	private async usedImages(paths: string[]): Promise<Set<string>> {
		const used = new Set<string>();
		const wanted = new Set(paths);
		const mark = (value: unknown) => typeof value === 'string' && wanted.has(value) && used.add(value);

		(
			await this.memberModel
				.find({ memberImage: { $in: paths } }, { memberImage: 1 })
				.lean()
				.exec()
		).forEach((ele: any) => mark(ele.memberImage));
		(
			await this.propertyModel
				.find({ propertyImages: { $in: paths } }, { propertyImages: 1 })
				.lean()
				.exec()
		).forEach((ele: { propertyImages?: string[] }) => {
			for (const image of ele.propertyImages ?? []) mark(image);
		});
		(
			await this.messageModel
				.find({ image: { $in: paths } }, { image: 1 })
				.lean()
				.exec()
		).forEach((ele: any) => mark(ele.image));
		// article images live inside the article text
		const anyPath = new RegExp(paths.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));
		const articles = await this.boardArticleModel
			.find(
				{ $or: [{ articleImage: { $in: paths } }, { articleContent: { $regex: anyPath } }] },
				{ articleContent: 1, articleImage: 1 },
			)
			.lean()
			.exec();
		for (const ele of articles as any[]) {
			mark(ele.articleImage);
			for (const item of paths) if (String(ele.articleContent ?? '').includes(item)) used.add(item);
		}
		return used;
	}

	/** non-active cars and non-sellers have no rank; active ones are re-ranked by the next jobs (no empty gap) */
	public async batchRollback(): Promise<void> {
		await this.propertyModel
			.updateMany({ propertyStatus: { $ne: PropertyStatus.ACTIVE }, propertyRank: { $ne: 0 } }, { propertyRank: 0 })
			.exec();
		await this.memberModel
			.updateMany(
				{
					$or: [
						{ memberStatus: { $ne: MemberStatus.ACTIVE } },
						{ memberType: { $nin: [MemberType.USER, MemberType.AGENT] } },
					],
					memberRank: { $ne: 0 },
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	/** rank = likes * 2 + views, computed by the database in one update */
	public async batchTopProperties(): Promise<void> {
		await this.propertyModel
			.updateMany({ propertyStatus: PropertyStatus.ACTIVE }, [
				{
					$set: {
						propertyRank: {
							$add: [{ $multiply: [{ $ifNull: ['$propertyLikes', 0] }, 2] }, { $ifNull: ['$propertyViews', 0] }],
						},
					},
				},
			])
			.exec();
	}

	/** every seller is ranked (dealers and private sellers): cars * 5 + articles * 3 + likes * 2 + views */
	public async batchTopAgents(): Promise<void> {
		await this.memberModel
			.updateMany({ memberType: { $in: [MemberType.USER, MemberType.AGENT] }, memberStatus: MemberStatus.ACTIVE }, [
				{
					$set: {
						memberRank: {
							$add: [
								{ $multiply: [{ $ifNull: ['$memberProperties', 0] }, 5] },
								{ $multiply: [{ $ifNull: ['$memberArticles', 0] }, 3] },
								{ $multiply: [{ $ifNull: ['$memberLikes', 0] }, 2] },
								{ $ifNull: ['$memberViews', 0] },
							],
						},
					},
				},
			])
			.exec();
	}

	public getHello(): string {
		return 'Welcome to CarPort BATCH Server!';
	}
}
