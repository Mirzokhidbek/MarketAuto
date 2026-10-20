import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { GET_SAVED_SEARCHES } from '../../../apollo/user/query';
import { REMOVE_SAVED_SEARCH } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { countryName, formatEnumLabel } from '../../utils';
import EmptyState from '../common/EmptyState';
import { T } from '../../types/common';

/** short human summary of the saved filters: "Kia, Hyundai · South Korea · 2020–2026" */
const describe = (search: T, t: any): string => {
	const parts: string[] = [];
	if (search.brandList?.length) parts.push(search.brandList.map((item: string) => formatEnumLabel(item, t)).join(', '));
	if (search.model) parts.push(search.model);
	if (search.countryList?.length) parts.push(search.countryList.map((item: string) => countryName(item, t)).join(', '));
	if (search.typeList?.length) parts.push(search.typeList.map((item: string) => formatEnumLabel(item, t)).join(', '));
	if (search.yearsRange) parts.push(`${search.yearsRange.start}–${search.yearsRange.end}`);
	if (search.pricesRange?.end && search.pricesRange.end < 2000000) parts.push(`≤ $${search.pricesRange.end.toLocaleString('en-US')}`);
	if (search.noAccident) parts.push(t('No accidents'));
	return parts.join(' · ') || t('All cars');
};

const SavedSearches = () => {
	const { t } = useTranslation('common');
	const { data, loading, refetch } = useQuery(GET_SAVED_SEARCHES, { fetchPolicy: 'network-only' });
	const [removeSavedSearch] = useMutation(REMOVE_SAVED_SEARCH);
	const list: T[] = data?.getSavedSearches ?? [];

	const removeHandler = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert(t('Delete this saved search?') as string))) return;
			await removeSavedSearch({ variables: { id } });
			await refetch();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Saved searches')}</h1>
					<p>{t('We notify you when a new car matches one of these searches.')}</p>
				</div>
			</div>
			{list.length ? (
				<div className={'ma-manage-list'}>
					{list.map((item) => {
						const search = JSON.parse(item.search || '{}');
						const href = `/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search })}`;
						return (
							<div className={'ma-saved'} key={item._id}>
								<NotificationsActiveOutlinedIcon />
								<div>
									<Link href={href}>
										<strong>{item.title}</strong>
									</Link>
									<span>{describe(search, t)}</span>
									<small>
										{item.lastNotifiedAt
											? `${t('Last match')}: ${moment(item.lastNotifiedAt).fromNow()}`
											: `${t('Saved')}: ${moment(item.createdAt).format('DD.MM.YYYY')}`}
									</small>
								</div>
								<Link href={href}>
									<span className={'ma-btn ma-btn--outline'}>{t('Open')}</span>
								</Link>
								<button className={'ma-icon-btn ma-icon-btn--danger'} onClick={() => removeHandler(item._id)} aria-label={t('Delete') as string}>
									<DeleteOutlineIcon />
								</button>
							</div>
						);
					})}
				</div>
			) : (
				<EmptyState
					loading={loading}
					text={t('Set filters on the car search page and press "Save search & get alerts".')}
					actionLabel={t('Browse cars')}
					actionHref={'/property'}
				/>
			)}
		</div>
	);
};

export default SavedSearches;
