import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { GET_NOTICES } from '../../../apollo/user/query';
import { T } from '../../types/common';

/** announcements published by admins (Admin > CS > Notice) */
const NoticeList = () => {
	const { t } = useTranslation('common');
	const { data, loading } = useQuery(GET_NOTICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 50, search: { noticeCategory: 'NOTICE' } } },
	});
	const notices: T[] = data?.getNotices?.list ?? [];

	if (!notices.length)
		return <div className={'ma-empty'}>{loading ? t('Loading...') : t('No announcements yet.')}</div>;

	return (
		<div className={'ma-notice-list'}>
			{notices.map((item, index) => (
				<details className={'ma-faq ma-notice-item'} key={item._id}>
					<summary>
						<span className={'ma-notice__no'}>{index + 1}</span>
						<strong>{item.noticeTitle}</strong>
						<span className={'ma-notice__date'}>{moment(item.createdAt).format('DD.MM.YYYY')}</span>
						<ExpandMoreRoundedIcon />
					</summary>
					<p>{item.noticeContent}</p>
				</details>
			))}
		</div>
	);
};

export default NoticeList;
