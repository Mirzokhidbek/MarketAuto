import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import { PropertyService } from '../property/property.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { Comments, Comment } from '../../libs/dto/comment/comment';
import { lookupMember } from '../../libs/config';
import { T } from '../../libs/types/common';

const logger = new Logger('CommentService');

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly memberService: MemberService,
		private readonly propertyService: PropertyService,
		private readonly boardArticleService: BoardArticleService,
		private readonly notificationService: NotificationService,
	) {}

	public async createComment(memberId: ObjectId, input: CommentInput): Promise<Comment> {
		input.memberId = memberId;
		// bump the target's counter first: it fails when the target does not exist, so no orphan comments
		const target = await this.commentStatsEditor(input.commentGroup, input.commentRefId, 1);
		let result: Comment;
		try {
			result = await this.commentModel.create(input);
		} catch (err: any) {
			logger.warn(`Error, Service.model: ${err.message}`);
			await this.commentStatsEditor(input.commentGroup, input.commentRefId, -1);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		await this.notificationService.notify({
			notificationType: NotificationType.COMMENT,
			notificationGroup: target.group,
			notificationTitle: target.title,
			authorId: memberId,
			receiverId: target.ownerId,
			propertyId: input.commentGroup === CommentGroup.PROPERTY ? input.commentRefId : undefined,
			articleId: input.commentGroup === CommentGroup.ARTICLE ? input.commentRefId : undefined,
		});
		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const result = await this.commentModel
			.findOneAndUpdate(
				{
					_id: _id,
					memberId: memberId,
					commentStatus: CommentStatus.ACTIVE,
				},
				input,
				{
					new: true,
				},
			)
			.exec();
		if (!result) throw new BadRequestException(Message.UPDATE_FAILED);
		if (result.commentStatus === CommentStatus.DELETE) {
			await this.commentStatsEditor(result.commentGroup, result.commentRefId, -1);
		}
		return result;
	}

	/** updates the commented item's counter and returns who owns it (for the notification) */
	private async commentStatsEditor(
		group: CommentGroup,
		refId: ObjectId,
		modifier: number,
	): Promise<{ ownerId: ObjectId; title: string; group: NotificationGroup }> {
		switch (group) {
			case CommentGroup.PROPERTY: {
				const property = await this.propertyService.propertyStatsEditor({ _id: refId, targetKey: 'propertyComments', modifier });
				return { ownerId: property.memberId, title: property.propertyTitle, group: NotificationGroup.PROPERTY };
			}
			case CommentGroup.ARTICLE: {
				const article = await this.boardArticleService.boardArticleStatsEditor({ _id: refId, targetKey: 'articleComments', modifier });
				if (!article) throw new NotFoundException(Message.NO_DATA_FOUND);
				return { ownerId: article.memberId, title: article.articleTitle, group: NotificationGroup.ARTICLE };
			}
			default: {
				const member = await this.memberService.memberStatsEditor({ _id: refId, targetKey: 'memberComments', modifier });
				return { ownerId: member._id, title: member.memberNick, group: NotificationGroup.MEMBER };
			}
		}
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search;
		const match: T = { commentRefId: commentRefId, commentStatus: CommentStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result: Comments[] = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							// meLiked
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new NotFoundException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async removeCommentByAdmin(input: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(input).exec();
		if (!result) throw new BadRequestException(Message.REMOVE_FAILED);
		if (result.commentStatus === CommentStatus.ACTIVE) {
			await this.commentStatsEditor(result.commentGroup, result.commentRefId, -1).catch(() => undefined);
		}
		return result;
	}
}
