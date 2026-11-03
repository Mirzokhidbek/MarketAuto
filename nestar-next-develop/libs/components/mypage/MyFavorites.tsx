import Link from 'next/link';
import EmptyState from '../ui/EmptyState';
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import CarCard from '../car/CarCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { GET_FAVORITES } from '../../../apollo/user/query';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { userVar } from '../../../apollo/store';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { accountPanel, accountPanelHead } from '../ui/styles';
import Pagination from '../ui/Pagination';

const MyFavorites: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [myFavorites, setMyFavorites] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchFavorites, setSearchFavorites] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation<any>(LIKE_TARGET_PROPERTY);

	const {
		loading: getFavoritesLoading,
		data: getFavoritesData,
		error: getFavoritesError,
		refetch: getFavoritesRefetch,
	} = useQuery<any>(GET_FAVORITES, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchFavorites,
		},
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getFavoritesData) return;
		const data: any = getFavoritesData;
		setMyFavorites(data.getFavorites?.list);
		setTotal(data.getFavorites?.metaCounter?.[0]?.total || 0);
	}, [getFavoritesData]);

	/** HANDLERS **/
	const paginationHandler = (value: number) => {
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
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('My Favorites')}</h1>
					<p>{t('Cars you saved with the heart button.')}</p>
				</div>
			</div>
			{/* phones: saved cars and followed sellers side by side, as in the app */}
			<nav className="mb-3 flex gap-5 border-b border-line font-sans text-sm sm:hidden">
				<span className="py-2.5 font-semibold text-primary shadow-[inset_0_-2px_0_var(--color-primary)]">
					{t('Cars')} ({total})
				</span>
				<Link href={{ pathname: '/mypage', query: { category: 'followings' } }} className="py-2.5 text-muted">
					{t('Sellers')}
				</Link>
			</nav>
			{myFavorites?.length ? (
				<div className="grid grid-cols-1 gap-y-8 max-sm:gap-y-0 sm:grid-cols-2 sm:gap-x-6">
					{myFavorites.map((property: Property) => (
						// every car here is a favorite: the heart shows filled (the list does not carry meLiked)
						<CarCard
							property={
								{
									...property,
									meLiked: [{ memberId: user._id, likeRefId: property._id, myFavorite: true }],
								} as Property
							}
							key={property._id}
							onLike={(id) => likePropertyHandler(user, id)}
						/>
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
				<Pagination page={searchFavorites.page} total={total} pageSize={searchFavorites.limit} onChange={paginationHandler} />
			)}
		</div>
	);
};

export default MyFavorites;
