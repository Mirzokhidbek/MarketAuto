import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { NotificationCategory, NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

const ME = new Types.ObjectId();
const OTHER = new Types.ObjectId();

const setup = (unread: { _id: string; count: number }[] = []) => {
	const pipelines: any[] = [];
	const model = {
		aggregate: jest.fn((pipeline: any[]) => {
			pipelines.push(pipeline);
			const isUnread = pipeline.some((stage) => stage.$group);
			return { exec: () => Promise.resolve(isUnread ? unread : [{ list: [], metaCounter: [] }]) };
		}),
		updateMany: jest.fn(() => ({ exec: () => Promise.resolve({ modifiedCount: 2 }) })),
		deleteMany: jest.fn(() => ({ exec: () => Promise.resolve({ deletedCount: 3 }) })),
		create: jest.fn((data: any) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
	};
	const socket = { emitToMember: jest.fn() };
	return { service: new NotificationService(model as any, socket as any), model, socket, pipelines };
};

describe('NotificationService', () => {
	it('filters by tab and unread, and counts unread per tab', async () => {
		const { service, pipelines } = setup([
			{ _id: NotificationType.LIKE, count: 2 },
			{ _id: NotificationType.FOLLOW, count: 1 },
			{ _id: NotificationType.PRICE_DROP, count: 4 },
		]);
		const result = await service.getNotifications(ME as any, {
			page: 1,
			limit: 10,
			unreadOnly: true,
			category: NotificationCategory.ALERTS,
		});
		expect(pipelines[0][0].$match).toEqual({
			receiverId: ME,
			notificationStatus: 'WAIT',
			notificationType: { $in: [NotificationType.NEW_LISTING, NotificationType.PRICE_DROP] },
		});
		expect(result.unreadCount).toBe(7);
		expect(result.unreadByCategory).toEqual({ activity: 3, listings: 0, alerts: 4 });
	});

	it('marks only the member’s own notifications read', async () => {
		const { service, model } = setup();
		const id = new Types.ObjectId().toHexString();
		await service.markNotificationsRead(ME as any, [id]);
		const [filter] = (model.updateMany.mock.calls[0] as any[]) ?? [];
		expect(filter.receiverId).toBe(ME);
		expect(filter._id.$in.map(String)).toEqual([id]);
		await service.markNotificationsRead(ME as any);
		expect((model.updateMany.mock.calls[1] as any[])[0]).toEqual({ receiverId: ME, notificationStatus: 'WAIT' });
	});

	it('deletes chosen ids or every read one, never someone else’s', async () => {
		const { service, model } = setup();
		expect(await service.removeNotifications(ME as any, [])).toBe(0);
		expect(model.deleteMany).not.toHaveBeenCalled();
		await service.removeNotifications(ME as any, [], true);
		expect((model.deleteMany.mock.calls[0] as any[])[0]).toEqual({ receiverId: ME, notificationStatus: 'READ' });
	});

	it('pushes a new notification to the receiver live, but not to the author himself', async () => {
		const { service, socket } = setup();
		const base = {
			notificationType: NotificationType.LIKE,
			notificationGroup: NotificationGroup.PROPERTY,
			notificationTitle: 'Kia K5',
			authorId: OTHER as any,
			receiverId: ME as any,
		};
		await service.notify(base);
		expect(socket.emitToMember).toHaveBeenCalledWith(
			ME.toHexString(),
			expect.objectContaining({ event: 'notification' }),
		);
		await service.notify({ ...base, authorId: ME as any });
		expect(socket.emitToMember).toHaveBeenCalledTimes(1);
	});
});
