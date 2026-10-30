import { useEffect } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { MARK_NOTIFICATIONS_READ, REMOVE_NOTIFICATIONS } from '../../../apollo/user/mutation';
import { notificationPingVar, unreadNotificationsVar } from '../../../apollo/store';
import { NotificationCategory } from '../../enums/notification.enum';
import { T } from '../../types/common';

interface Options {
	limit: number;
	category?: NotificationCategory | 'ALL';
	unreadOnly?: boolean;
	/** skip the request (e.g. logged out) */
	skip?: boolean;
}

/**
 * One notification list with its actions. The socket bumps notificationPingVar on every new notification,
 * so the list reloads at once; the 60 s poll only covers a dropped connection.
 */
export const useNotifications = ({ limit, category = 'ALL', unreadOnly = false, skip = false }: Options) => {
	const ping = useReactiveVar(notificationPingVar);
	const input = { page: 1, limit, unreadOnly, ...(category !== 'ALL' ? { category } : {}) };
	const { data, loading, refetch, fetchMore } = useQuery(GET_NOTIFICATIONS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		pollInterval: 60000,
		skip,
	});
	const [markMutation] = useMutation(MARK_NOTIFICATIONS_READ);
	const [removeMutation] = useMutation(REMOVE_NOTIFICATIONS);

	const result = data?.getNotifications;
	const list: T[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;
	const unreadCount: number = result?.unreadCount ?? 0;
	const unreadByCategory: Record<string, number> = { all: unreadCount, ...(result?.unreadByCategory ?? {}) };

	useEffect(() => {
		if (result) unreadNotificationsVar(unreadCount);
	}, [result, unreadCount]);

	useEffect(() => {
		if (ping && !skip) refetch().then();
	}, [ping]); // eslint-disable-line react-hooks/exhaustive-deps

	/** next page, appended to the list */
	const loadMore = () =>
		fetchMore({
			variables: { input: { ...input, page: Math.floor(list.length / limit) + 1 } },
			updateQuery: (prev: T, { fetchMoreResult }: T) => {
				if (!fetchMoreResult) return prev;
				const seen = new Set(prev.getNotifications.list.map((item: T) => item._id));
				return {
					getNotifications: {
						...fetchMoreResult.getNotifications,
						list: [
							...prev.getNotifications.list,
							...fetchMoreResult.getNotifications.list.filter((item: T) => !seen.has(item._id)),
						],
					},
				};
			},
		});

	// every open notification list (the bell and the My Page list) reloads, so their counts stay in step
	const refresh = { refetchQueries: ['GetNotifications'], awaitRefetchQueries: true };
	const markRead = async (ids?: string[]) => {
		await markMutation({ variables: { ids }, ...refresh });
	};
	const remove = async (ids: string[]) => {
		await removeMutation({ variables: { ids }, ...refresh });
	};
	const clearRead = async () => {
		await removeMutation({ variables: { readOnly: true }, ...refresh });
	};

	return { list, total, loading, unreadCount, unreadByCategory, hasMore: list.length < total, loadMore, markRead, remove, clearRead, refetch };
};
