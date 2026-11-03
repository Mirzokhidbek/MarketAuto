import React from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import moment from 'moment';
import { GET_NOTICES } from '../../../apollo/user/query';
import { T } from '../../types/common';
import { ChevronDownIcon as ExpandMoreRoundedIcon } from '../ui/icons';
import { emptyBox, faqBody, faqItem, faqSummary } from '../ui/styles';

/** announcements published by admins (Admin > CS > Notice) */
const NoticeList = () => {
	const { t } = useTranslation('common');
	const { data, loading } = useQuery<any>(GET_NOTICES, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 50, search: { noticeCategory: 'NOTICE' } } },
	});
	const notices: T[] = data?.getNotices?.list ?? [];

	if (!notices.length)
		return <div className={emptyBox}>{loading ? t('Loading...') : t('No announcements yet.')}</div>;

	return (
		<div className="flex flex-col font-sans">
			{notices.map((item, index) => (
				<details className={faqItem} key={item._id}>
					<summary className={faqSummary}>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-sm font-bold text-primary">{index + 1}</span>
						<strong className="flex-1 font-medium">{item.noticeTitle}</strong>
						<span className="text-[13px] text-muted">{moment(item.createdAt).format('DD.MM.YYYY')}</span>
						<ExpandMoreRoundedIcon />
					</summary>
					<p className={faqBody}>{item.noticeContent}</p>
				</details>
			))}
		</div>
	);
};

export default NoticeList;
