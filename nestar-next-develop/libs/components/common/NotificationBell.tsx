import { imageUrl } from '../../utils';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import { Badge, Popover } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { MARK_NOTIFICATIONS_READ } from '../../../apollo/user/mutation';
import { REACT_APP_API_URL } from '../../config';
import { T } from '../../types/common';

// translation key per notification type + group; {{name}} is the member who triggered it
const messages: Record<string, string> = {
	LIKE_PROPERTY: '{{name}} liked your car',
	LIKE_ARTICLE: '{{name}} liked your article',
	LIKE_MEMBER: '{{name}} liked your profile',
	COMMENT_PROPERTY: '{{name}} commented on your car',
	COMMENT_ARTICLE: '{{name}} commented on your article',
	COMMENT_MEMBER: '{{name}} left a review on your profile',
	FOLLOW_MEMBER: '{{name}} started following you',
	LISTING_APPROVED_PROPERTY: 'Your listing was approved and is now visible',
	LISTING_REJECTED_PROPERTY: 'Your listing was rejected by moderation',
	NEW_LISTING_PROPERTY: 'New car for your saved search',
	PRICE_DROP_PROPERTY: 'Price dropped on a car you saved',
};

const NotificationBell = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);

	const { data, refetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 10 } },
		pollInterval: 30000,
	});
	const [markNotificationsRead] = useMutation(MARK_NOTIFICATIONS_READ);

	const list: T[] = data?.getNotifications?.list ?? [];
	const unread: number = data?.getNotifications?.unreadCount ?? 0;

	const openHandler = async (e: React.MouseEvent<HTMLElement>) => {
		setAnchor(e.currentTarget);
		if (unread > 0) {
			await markNotificationsRead();
			await refetch();
		}
	};

	const goHandler = async (item: T) => {
		setAnchor(null);
		// a rejected listing is not public: send the seller to the list where it can be fixed
		if (item.notificationType === 'LISTING_REJECTED') await router.push('/mypage?category=myProperties&status=REJECTED');
		else if (item.propertyId) await router.push(`/property/detail?id=${item.propertyId}`);
		else if (item.articleId) await router.push(`/community/detail?id=${item.articleId}`);
		else await router.push(`/member?memberId=${item.authorId}`);
	};

	return (
		<>
			<button className={'ma-bell'} onClick={openHandler} aria-label={t('Notifications') as string}>
				<Badge badgeContent={unread} color="error" max={99}>
					<NotificationsOutlinedIcon className={'notification-icon'} />
				</Badge>
			</button>
			<Popover
				open={!!anchor}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{ className: 'ma-bell__panel' }}
			>
				<div className={'ma-bell__head'}>{t('Notifications')}</div>
				{list.length ? (
					list.map((item) => {
						const author = item.authorData;
						const name = author?.memberFullName || author?.memberNick || t('Someone');
						const key = `${item.notificationType}_${item.notificationGroup}`;
						return (
							<button
								key={item._id}
								className={`ma-bell__item ${item.notificationStatus === 'WAIT' ? 'is-new' : ''}`}
								onClick={() => goHandler(item)}
							>
								<img
									src={author?.memberImage ? imageUrl(author.memberImage) : '/img/profile/defaultUser.svg'}
									alt={''}
								/>
								<div>
									<p>
										{t(messages[key] ?? '{{name}}', { name })}
										{item.notificationGroup !== 'MEMBER' && <strong> “{item.notificationTitle}”</strong>}
									</p>
									{item.notificationType === 'LISTING_REJECTED' && item.notificationDesc && (
										<em className={'ma-bell__reason'}>
											{t('Reason')}: {item.notificationDesc}
										</em>
									)}
									<span>{moment(item.createdAt).fromNow()}</span>
								</div>
							</button>
						);
					})
				) : (
					<div className={'ma-bell__empty'}>{t('No notifications yet.')}</div>
				)}
			</Popover>
		</>
	);
};

export default NotificationBell;
