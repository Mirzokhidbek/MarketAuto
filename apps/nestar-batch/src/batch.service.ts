import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../nestar-api/src/libs/dto/member/member';
import { Property } from '../../nestar-api/src/libs/dto/property/property';
import { MemberStatus, MemberType } from '../../nestar-api/src/libs/enums/member.enum';
import { PropertyStatus } from '../../nestar-api/src/libs/enums/property.enum';

@Injectable()
export class BatchService {
	constructor(
		@InjectModel('Property') private readonly propertyModel: Model<Property>,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<any>,
	) {}

	/**
	 * Deletes uploaded images nobody uses any more (abandoned "add car" forms, replaced avatars missed by the API).
	 * Only local uploads/ files older than one day are touched; S3 objects are managed by the API.
	 */
	public async batchCleanUploads(): Promise<number> {
		const used = new Set<string>();
		(await this.propertyModel.find({}, { propertyImages: 1 }).lean().exec()).forEach((ele: any) =>
			(ele.propertyImages ?? []).forEach((image: string) => used.add(image)),
		);
		(await this.memberModel.find({}, { memberImage: 1 }).lean().exec()).forEach(
			(ele: any) => ele.memberImage && used.add(ele.memberImage),
		);
		// article images live inside the article text
		const articleTexts = (await this.boardArticleModel.find({}, { articleContent: 1, articleImage: 1 }).lean().exec())
			.map((ele: any) => `${ele.articleContent ?? ''} ${ele.articleImage ?? ''}`)
			.join(' ');

		const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
		let removed = 0;
		for (const target of ['property', 'member', 'article']) {
			const dir = path.join('uploads', target);
			if (!fs.existsSync(dir)) continue;
			for (const file of await fs.promises.readdir(dir)) {
				const relative = `uploads/${target}/${file}`;
				if (used.has(relative) || articleTexts.includes(relative)) continue;
				const stat = await fs.promises.stat(path.join(dir, file));
				if (stat.mtimeMs > dayAgo) continue; // may belong to a form being filled right now
				await fs.promises.unlink(path.join(dir, file));
				removed++;
			}
		}
		return removed;
	}

	public async batchRollback(): Promise<void> {
		await this.propertyModel
			.updateMany(
				{
					propertyStatus: PropertyStatus.ACTIVE,
				},
				{ propertyRank: 0 },
			)
			.exec();

		await this.memberModel
			.updateMany(
				{
					memberStatus: MemberStatus.ACTIVE,
					// every seller is ranked: dealers and private sellers
					memberType: { $in: [MemberType.USER, MemberType.AGENT] },
				},
				{ memberRank: 0 },
			)
			.exec();
	}

	public async batchTopProperties(): Promise<void> {
		const properties: Property[] = await this.propertyModel
			.find({
				propertyStatus: PropertyStatus.ACTIVE,
				propertyRank: 0,
			})
			.exec();

		const promisedList = properties.map(async (ele: Property) => {
			const { _id, propertyLikes, propertyViews } = ele;
			const rank = propertyLikes * 2 + propertyViews * 1;
			return await this.propertyModel.findByIdAndUpdate(_id, { propertyRank: rank });
		});
		await Promise.all(promisedList);
	}

	public async batchTopAgents(): Promise<void> {
		const agents: Member[] = await this.memberModel
			.find({
				// every seller is ranked: dealers and private sellers
					memberType: { $in: [MemberType.USER, MemberType.AGENT] },
				memberStatus: MemberStatus.ACTIVE,
				memberRank: 0,
			})
			.exec();

		const promisedList = agents.map(async (ele: Member) => {
			const { _id, memberProperties, memberLikes, memberArticles, memberViews } = ele;
			const rank = memberProperties * 5 + memberArticles * 3 + memberLikes * 2 + memberViews * 1;
			return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
		});
		await Promise.all(promisedList);
	}

	public getHello(): string {
		return 'Welcome to MarketAuto BATCH Server!';
	}
}
