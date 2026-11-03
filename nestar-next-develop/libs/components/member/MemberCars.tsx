import EmptyState from '../ui/EmptyState';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import CarCard from '../car/CarCard';
import { Property } from '../../types/property/property';
import { PropertiesInquiry } from '../../types/property/property.input';
import { T } from '../../types/common';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client/react';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { accountPanel, accountPanelHead } from '../ui/styles';
import Pagination from '../ui/Pagination';

const MyCars: NextPage = ({ initialInput = defaultProps.initialInput, ...props }: any) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { memberId } = router.query;
	const [searchFilter, setSearchFilter] = useState<PropertiesInquiry>({ ...initialInput });
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery<any>(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter?.search?.memberId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getPropertiesData) return;
		const data: any = getPropertiesData;
		setAgentProperties(data?.getProperties?.list);
		setTotal(data?.getProperties?.metaCounter[0]?.total ?? 0);
	}, [getPropertiesData]);

	/** LIFECYCLES **/
	useEffect(() => {
		getPropertiesRefetch().then();
	}, [searchFilter]);

	useEffect(() => {
		if (memberId)
			setSearchFilter({ ...initialInput, search: { ...initialInput.search, memberId: memberId as string } });
	}, [memberId]);

	/** HANDLERS **/
	const paginationHandler = (value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	return (
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Cars')}</h1>
					<p>
						{total || 0} {t('cars listed')}
					</p>
				</div>
			</div>
			{agentProperties?.length ? (
				<div className="grid grid-cols-1 gap-y-8 max-sm:gap-y-0 sm:grid-cols-2 sm:gap-x-6">
					{agentProperties.map((item: any) => (
						<CarCard property={item} key={item._id} />
					))}
				</div>
			) : (
				<EmptyState loading={getPropertiesLoading} text={t('No cars listed yet.')} />
			)}
			{total > searchFilter.limit && (
				<Pagination page={searchFilter.page} total={total} pageSize={searchFilter.limit} onChange={paginationHandler} />
			)}
		</div>
	);
};

// React 19 has no defaultProps on function components: used as the default value below
const defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		search: {
			memberId: '',
		},
	},
};

export default MyCars;
