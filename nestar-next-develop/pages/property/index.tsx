import { fetchWithTimeout } from '../../libs/utils';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Pagination from '../../libs/components/ui/Pagination';
import CarGrid from '../../libs/components/car/CarGrid';
import PageContainer from '../../libs/components/ui/PageContainer';
import { buttonClasses } from '../../libs/components/ui/Button';
import CarCard from '../../libs/components/car/CarCard';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import CarFilter from '../../libs/components/car/CarFilter';
import CarFilterChips from '../../libs/components/car/CarFilterChips';
import CarGridSkeleton from '../../libs/components/car/CarGridSkeleton';
import { useRouter } from 'next/router';
import { PropertiesInquiry } from '../../libs/types/property/property.input';
import { Property } from '../../libs/types/property/property';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { Direction, Message } from '../../libs/enums/common.enum';
import { GET_PROPERTIES } from '../../apollo/user/query';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { userVar } from '../../apollo/store';
import { useTranslation } from 'next-i18next/pages';
import { T } from '../../libs/types/common';
import { LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';

const defaultInput = {
	page: 1,
	limit: 9,
	sort: 'createdAt',
	direction: 'DESC',
	search: { mileageRange: { start: 0, end: 500000 }, pricesRange: { start: 0, end: 2000000 } },
};

const parseInput = (raw?: string | string[]) => {
	try {
		return raw ? JSON.parse(String(raw)) : defaultInput;
	} catch (err) {
		return defaultInput;
	}
};

const SSR_FIELDS = `list { _id propertyType propertyStatus propertyLocation propertyAddress propertyTitle propertyPrice
	carBrand carModel carYear carMileage carFuel carTransmission carEngine carTrim carCountry carCustomsCleared
	propertyBarter propertyNegotiable propertyImages propertyLikes propertyViews memberId createdAt } metaCounter { total }`;

/**
 * The first page of results is rendered on the server, so search engines and slow phones see the cars
 * immediately; after that the client takes over with Apollo as before.
 */
export const getServerSideProps = async ({ locale, query }: any) => {
	let initialList: Property[] = [];
	let initialTotal = 0;
	try {
		const response = await fetchWithTimeout(
			(process.env.API_INTERNAL_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL) as string,
			{
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					query: `query($input: PropertiesInquiry!){ getProperties(input: $input){ ${SSR_FIELDS} } }`,
					variables: { input: parseInput(query?.input) },
				}),
			},
		);
		const { data } = await response.json();
		initialList = data?.getProperties?.list ?? [];
		initialTotal = data?.getProperties?.metaCounter?.[0]?.total ?? 0;
	} catch (err) {
		// API down: the page still renders and the client retries
	}
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
			initialList,
			initialTotal,
		},
	};
};

const PropertyList: NextPage = ({ initialList = [], initialTotal = 0 }: any) => {
	const initialInput = defaultInput as unknown as PropertiesInquiry;
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>(parseInput(router?.query?.input));
	const [properties, setProperties] = useState<Property[]>(initialList);
	const [total, setTotal] = useState<number>(initialTotal);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation<any>(LIKE_TARGET_PROPERTY);

	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery<any>(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getPropertiesData) return;
		const data: any = getPropertiesData;
		setProperties(data?.getProperties?.list);
		setTotal(data?.getProperties?.metaCounter[0]?.total);
	}, [getPropertiesData]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.input) setSearchFilter(parseInput(router.query.input));

		setCurrentPage(searchFilter.page === undefined ? 1 : searchFilter.page);
	}, [router]);

	/** HANDLERS **/
	const handlePaginationChange = async (value: number) => {
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
		await router.replace(
			`/property?input=${JSON.stringify(nextFilter)}`,
			`/property?input=${JSON.stringify(nextFilter)}`,
			{
				scroll: false,
			},
		);
	};

	return (
		<div id="property-list-page" className="pt-8 pb-20 font-sans">
			<PageContainer className="grid grid-cols-1 items-start gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-7 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-10">
				<CarFilter searchFilter={searchFilter} setSearchFilter={setSearchFilter} initialInput={initialInput} total={total} />

				<section className="min-w-0">
					<div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4 max-md:max-sm:flex-row md:items-end">
						<div>
							<h2 className="m-0 mb-1 text-lg font-bold tracking-[-0.01em] text-ink sm:text-xl">{t('Cars for sale')}</h2>
							<span className="text-sm text-muted">
								{total || 0} {t('cars found')}
							</span>
						</div>
						<label className="ml-auto flex items-center gap-2.5">
							<span className="text-sm whitespace-nowrap text-muted max-sm:hidden">{t('Sort by')}</span>
							<select
								className="h-[38px] cursor-pointer rounded-md border border-line-strong bg-white px-3 font-sans text-sm text-text outline-none max-sm:max-w-[150px]"
								value={currentSort}
								onChange={(e) => sortingHandler(e.target.value)}
							>
								{sortOptions.map((item) => (
									<option value={item.id} key={item.id}>
										{t(item.label)}
									</option>
								))}
							</select>
						</label>
					</div>
					<CarFilterChips
						search={searchFilter.search ?? {}}
						defaults={defaultInput.search}
						onChange={(search) => {
							const next = JSON.stringify({ ...searchFilter, page: 1, search });
							router.replace(`/property?input=${next}`, `/property?input=${next}`, { scroll: false });
						}}
					/>

					{getPropertiesLoading && !properties?.length ? (
						<CarGridSkeleton count={6} />
					) : properties?.length === 0 ? (
						<div className="flex flex-col items-center gap-3.5 border-y border-line px-6 py-14 text-center text-[15px] text-muted">
							<strong className="block text-[17px] text-ink">{t('No cars found')}</strong>
							<p className="m-0">
								{t('Try changing or clearing your filters, or save this search to get an alert when such a car appears.')}
							</p>
							<button
								type="button"
								className={buttonClasses({ variant: 'outline' })}
								onClick={() => router.replace(`/property?input=${JSON.stringify(defaultInput)}`)}
							>
								{t('Clear all')}
							</button>
						</div>
					) : (
						<CarGrid>
							{properties.map((property: Property) => (
								<CarCard property={property} key={property?._id} onLike={(id) => likePropertyHandler(user, id)} />
							))}
						</CarGrid>
					)}

					{properties.length !== 0 && (
						<Pagination page={currentPage} total={total} pageSize={searchFilter.limit} onChange={handlePaginationChange} />
					)}
				</section>
			</PageContainer>
		</div>
	);
};

export default withLayoutBasic(PropertyList);
