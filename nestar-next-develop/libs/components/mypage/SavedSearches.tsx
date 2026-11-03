import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery } from '@apollo/client/react';
import { GET_SAVED_SEARCHES } from '../../../apollo/user/query';
import { REMOVE_SAVED_SEARCH } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { countryName, formatEnumLabel } from '../../utils';
import EmptyState from '../ui/EmptyState';
import { T } from '../../types/common';
import { DeleteIcon as DeleteOutlineIcon, BellRingIcon as NotificationsActiveOutlinedIcon } from '../ui/icons';
import { accountPanel, accountPanelHead, iconButtonDanger } from '../ui/styles';
import { buttonClasses } from '../ui/Button';
import { formatDate, fromNow } from '../../date';

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
	const { data, loading, refetch } = useQuery<any>(GET_SAVED_SEARCHES, { fetchPolicy: 'network-only' });
	const [removeSavedSearch] = useMutation<any>(REMOVE_SAVED_SEARCH);
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
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Saved searches')}</h1>
					<p>{t('We notify you when a new car matches one of these searches.')}</p>
				</div>
			</div>
			{list.length ? (
				<div className="flex flex-col gap-3">
					{list.map((item) => {
						const search = JSON.parse(item.search || '{}');
						const href = `/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', direction: 'DESC', search })}`;
						return (
							<div className="flex items-center gap-3.5 rounded-xl border border-line bg-white px-[18px] py-4" key={item._id}>
								<NotificationsActiveOutlinedIcon className="shrink-0 text-primary" />
								<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
									<Link href={href}>
										<strong className="text-ink">{item.title}</strong>
									</Link>
									<span className="text-[13px] text-muted">{describe(search, t)}</span>
									<small className="text-xs text-muted">
										{item.lastNotifiedAt
											? `${t('Last match')}: ${fromNow(item.lastNotifiedAt)}`
											: `${t('Saved')}: ${formatDate(item.createdAt, 'DD.MM.YYYY')}`}
									</small>
								</div>
								<Link href={href} className={buttonClasses({ variant: 'outline', className: 'max-sm:hidden' })}>
									{t('Open')}
								</Link>
								<button className={iconButtonDanger} onClick={() => removeHandler(item._id)} aria-label={t('Delete') as string}>
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
