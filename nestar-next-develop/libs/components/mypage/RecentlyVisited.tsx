import EmptyState from '../ui/EmptyState';
import React, { useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { Pagination } from '@mui/material';
import CarCard from '../car/CarCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { GET_VISITED } from '../../../apollo/user/query';
import { useQuery } from '@apollo/client';

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
	} = useQuery(GET_VISITED, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchVisited,
		},
		onCompleted: (data: T) => {
			setRecentlyVisited(data.getVisited?.list);
			setTotal(data.getVisited?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchVisited({ ...searchVisited, page: value });
	};

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Recently Visited')}</h1>
					<p>{t('Cars you viewed recently.')}</p>
				</div>
			</div>
			{recentlyVisited?.length ? (
				<div className={'ma-grid ma-grid--2'}>
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
				<div className={'ma-pagination'}>
					<Pagination
						count={Math.ceil(total / searchVisited.limit)}
						page={searchVisited.page}
						shape="rounded"
						onChange={paginationHandler}
					/>
				</div>
			)}
		</div>
	);
};

export default RecentlyVisited;
