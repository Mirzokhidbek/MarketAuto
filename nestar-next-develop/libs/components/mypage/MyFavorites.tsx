import EmptyState from '../common/EmptyState';
import React, { useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { Pagination } from '@mui/material';
import CarCard from '../car/CarCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { GET_FAVORITES } from '../../../apollo/user/query';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

const MyFavorites: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [myFavorites, setMyFavorites] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFavorites, setSearchFavorites] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const {
		loading: getFavoritesLoading,
		data: getFavoritesData,
		error: getFavoritesError,
		refetch: getFavoritesRefetch,
	} = useQuery(GET_FAVORITES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFavorites,
		},
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMyFavorites(data.getFavorites?.list);
			setTotal(data.getFavorites?.metaCounter?.[0]?.total || 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
		setSearchFavorites({ ...searchFavorites, page: value });
	};

	const likePropertyHandler = async (user: any, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetProperty({
				variables: {
					input: id,
				},
			});
			await getFavoritesRefetch({ input: searchFavorites });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('My Favorites')}</h1>
					<p>{t('Cars you saved with the heart button.')}</p>
				</div>
			</div>
			{myFavorites?.length ? (
				<div className={'ma-grid ma-grid--2'}>
					{myFavorites.map((property: Property) => (
						<CarCard property={property} key={property._id} onLike={(id) => likePropertyHandler(user, id)} />
					))}
				</div>
			) : (
				<EmptyState
					loading={getFavoritesLoading}
					text={t("You haven't saved any cars yet. Tap the heart on a car to save it.")}
					actionLabel={t('Browse cars')}
					actionHref={'/property'}
				/>
			)}
			{total > searchFavorites.limit && (
				<div className={'ma-pagination'}>
					<Pagination
						count={Math.ceil(total / searchFavorites.limit)}
						page={searchFavorites.page}
						shape="rounded"
						onChange={paginationHandler}
					/>
				</div>
			)}
		</div>
	);
};

export default MyFavorites;
