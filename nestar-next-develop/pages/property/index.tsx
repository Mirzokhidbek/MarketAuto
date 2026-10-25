import React, { ChangeEvent, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { Pagination } from '@mui/material';
import CarCard from '../../libs/components/common/CarCard';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Filter from '../../libs/components/property/Filter';
import { useRouter } from 'next/router';
import { PropertiesInquiry } from '../../libs/types/property/property.input';
import { Property } from '../../libs/types/property/property';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GET_PROPERTIES } from '../../apollo/user/query';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { useTranslation } from 'next-i18next';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PropertyList: NextPage = ({ initialInput, ...props }: any) => {
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(
		router?.query?.input ? JSON.parse(router?.query?.input as string) : initialInput,
	);
	const [properties, setProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProperties(data?.getProperties?.list);
			setTotal(data?.getProperties?.metaCounter[0]?.total);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) {
			const inputObj = JSON.parse(router?.query?.input as string);
			setSearchFilter(inputObj);
		}

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	useEffect(() => {
		// getPropertiesRefetch({ input: searchFilter }).then();
	}, [searchFilter]);

	/** HANDLERS **/
	const handlePaginationChange = async (event: ChangeEvent<unknown>, value: number) => {
		searchFilter.page = value;
		await router.push(
			`/property?input=${JSON.stringify(searchFilter)}`,
			`/property?input=${JSON.stringify(searchFilter)}`,
			{
				scroll: false,
			},
		);
		setCurrentPage(value);
	};

	const likePropertyHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			await likeTargetProperty({
				variables: { input: id },
			});
			await getPropertiesRefetch({ input: searchFilter });

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const sortOptions = [
		{ id: 'new', label: 'Newest first', sort: 'createdAt', direction: Direction.DESC },
		{ id: 'lowest', label: 'Lowest price', sort: 'propertyPrice', direction: Direction.ASC },
		{ id: 'highest', label: 'Highest price', sort: 'propertyPrice', direction: Direction.DESC },
		{ id: 'year', label: 'Newest year', sort: 'carYear', direction: Direction.DESC },
		{ id: 'mileage', label: 'Lowest mileage', sort: 'carMileage', direction: Direction.ASC },
		{ id: 'popular', label: 'Most viewed', sort: 'propertyViews', direction: Direction.DESC },
	];
	const currentSort =
		sortOptions.find((item) => item.sort === searchFilter.sort && item.direction == searchFilter.direction)?.id ??
		'new';

	const sortingHandler = async (id: string) => {
		const option = sortOptions.find((item) => item.id === id)!;
		const nextFilter = { ...searchFilter, page: 1, sort: option.sort, direction: option.direction };
		await router.push(
			`/property?input=${JSON.stringify(nextFilter)}`,
			`/property?input=${JSON.stringify(nextFilter)}`,
			{
				scroll: false,
			},
		);
	};

	return (
		<div id="property-list-page" className={'ma-page ma-list-page'}>
			<div className={'ma-container ma-list-layout'}>
				{/* @ts-ignore */}
				<Filter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} />

				<section className={'ma-results'}>
					<div className={'ma-results__bar'}>
						<div>
							<h2>{t('Cars for sale')}</h2>
							<span>
								{total || 0} {t('cars found')}
							</span>
						</div>
						<label className={'ma-sort'}>
							<span>{t('Sort by')}</span>
							<select value={currentSort} onChange={(e) => sortingHandler(e.target.value)}>
								{sortOptions.map((item) => (
									<option value={item.id} key={item.id}>
										{t(item.label)}
									</option>
								))}
							</select>
						</label>
					</div>

					{getPropertiesLoading && !properties?.length ? (
						<div className={'ma-empty'}>{t('Loading...')}</div>
					) : properties?.length === 0 ? (
						<div className={'ma-empty'}>
							<strong>{t('No cars found')}</strong>
							<p>{t('Try changing or clearing your filters.')}</p>
						</div>
					) : (
						<div className={'ma-grid ma-grid--3'}>
							{properties.map((property: Property) => (
								<CarCard property={property} key={property?._id} onLike={(id) => likePropertyHandler(user, id)} />
							))}
						</div>
					)}

					{properties.length !== 0 && total > searchFilter.limit && (
						<div className={'ma-pagination'}>
							<Pagination
								page={currentPage}
								count={Math.ceil(total / searchFilter.limit)}
								onChange={handlePaginationChange}
								shape="rounded"
							/>
						</div>
					)}
				</section>
			</div>
		</div>
	);
};

PropertyList.defaultProps = {
	initialInput: {
		page: 1,
		limit: 9,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			mileageRange: {
				start: 0,
				end: 500000,
			},
			pricesRange: {
				start: 0,
				end: 2000000,
			},
		},
	},
};

export default withLayoutBasic(PropertyList);
