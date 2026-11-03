import EmptyState from '../ui/EmptyState';
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import CarCard from '../car/CarCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { GET_VISITED } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client/react';
import { accountPanel, accountPanelHead } from '../ui/styles';
import Pagination from '../ui/Pagination';

const RecentlyVisited: NextPage = () => {
	const { t } = useTranslation('common');
	const [recentlyVisited, setRecentlyVisited] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchVisited, setSearchVisited] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const {
		loading: getVisitedLoading,
		data: getVisitedData,
		error: getVisitedError,
		refetch: getVisitedRefetch,
	} = useQuery<any>(GET_VISITED, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchVisited,
		},
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getVisitedData) return;
		const data: any = getVisitedData;
		setRecentlyVisited(data.getVisited?.list);
		setTotal(data.getVisited?.metaCounter?.[0]?.total || 0);
	}, [getVisitedData]);

	/** HANDLERS **/
	const paginationHandler = (value: number) => {
		setSearchVisited({ ...searchVisited, page: value });
	};

	return (
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Recently Visited')}</h1>
					<p>{t('Cars you viewed recently.')}</p>
				</div>
			</div>
			{recentlyVisited?.length ? (
				<div className="grid grid-cols-1 gap-y-8 max-sm:gap-y-0 sm:grid-cols-2 sm:gap-x-6">
					{recentlyVisited.map((property: Property) => (
						<CarCard property={property} key={property._id} />
					))}
				</div>
			) : (
				<EmptyState
					loading={getVisitedLoading}
					text={t('No recently visited cars yet.')}
					actionLabel={t('Browse cars')}
					actionHref={'/property'}
				/>
			)}
			{total > searchVisited.limit && (
				<Pagination page={searchVisited.page} total={total} pageSize={searchVisited.limit} onChange={paginationHandler} />
			)}
		</div>
	);
};

export default RecentlyVisited;
