import EmptyState from '../ui/EmptyState';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import ManageCarRow from './ManageCarRow';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { Property } from '../../types/property/property';
import { AgentPropertiesInquiry } from '../../types/property/property.input';
import { T } from '../../types/common';
import { PropertyStatus } from '../../enums/property.enum';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import { GET_AGENT_PROPERTIES } from '../../../apollo/user/query';
import { UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import { accountPanel, accountPanelHead } from '../ui/styles';
import { buttonClasses } from '../ui/Button';
import Pagination from '../ui/Pagination';
import UnderlineTabs from '../ui/UnderlineTabs';

const MyCars: NextPage = ({ initialInput = defaultProps.initialInput, ...props }: any) => {
	const { t } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<AgentPropertiesInquiry>(initialInput);
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/** APOLLO REQUESTS **/
	const [updateProperty] = useMutation<any>(UPDATE_PROPERTY);

	const {
		loading: getAgentPropertiesLoading,
		data: getAgentPropertiesData,
		error: getAgentPropertiesError,
		refetch: getAgentPropertiesRefetch,
	} = useQuery<any>(GET_AGENT_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getAgentPropertiesData) return;
		const data: any = getAgentPropertiesData;
		setAgentProperties(data?.getAgentProperties?.list);
		setTotal(data?.getAgentProperties?.metaCounter[0]?.total ?? 0);
	}, [getAgentPropertiesData]);

	// the bell links straight to a tab, e.g. ?status=REJECTED
	useEffect(() => {
		const status = router.query.status as PropertyStatus;
		if (status && Object.values(PropertyStatus).includes(status) && status !== PropertyStatus.DELETE)
			setSearchFilter((prev: AgentPropertiesInquiry) => ({ ...prev, page: 1, search: { propertyStatus: status } }));
	}, [router.query.status]);

	/** HANDLERS **/
	const paginationHandler = (value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const changeStatusHandler = (value: PropertyStatus) => {
		setSearchFilter({ ...searchFilter, search: { propertyStatus: value } });
	};

	const deletePropertyHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert(t('Are you sure you want to delete this car?') as string)) {
				await updateProperty({
					variables: {
						input: {
							_id: id,
							propertyStatus: 'DELETE',
						},
					},
				});

				await getAgentPropertiesRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const updatePropertyHandler = async (status: string, id: string) => {
		try {
			if (await sweetConfirmAlert(t(status === 'SOLD' ? 'Mark this car as sold?' : 'Change the status?') as string)) {
				await updateProperty({
					variables: {
						input: {
							_id: id,
							propertyStatus: status,
						},
					},
				});

				await getAgentPropertiesRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	// admins have no listings; wait until the user is restored from the token
	if (user?._id && user?.memberType === 'ADMIN') {
		router.push('/mypage').then();
	}

	const status = searchFilter.search.propertyStatus;

	return (
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('My Cars')}</h1>
					<p>{t('Manage your listings, mark cars as sold or edit details.')}</p>
				</div>
				<button className={buttonClasses()} onClick={() => router.push('/mypage?category=addProperty')}>
					+ {t('Add Car')}
				</button>
			</div>

			<UnderlineTabs
				items={[
					{ value: PropertyStatus.ACTIVE, label: t('For sale') },
					{ value: PropertyStatus.PENDING, label: t('Under review') },
					{ value: PropertyStatus.REJECTED, label: t('Rejected') },
					{ value: PropertyStatus.SOLD, label: t('Sold') },
				]}
				value={status ?? PropertyStatus.ACTIVE}
				onChange={changeStatusHandler}
			/>

			{agentProperties?.length ? (
				<div className="flex flex-col gap-3">
					{agentProperties.map((property: Property) => (
						<ManageCarRow
							property={property}
							key={property._id}
							onDelete={deletePropertyHandler}
							onStatusChange={updatePropertyHandler}
						/>
					))}
				</div>
			) : (
				<EmptyState
					loading={getAgentPropertiesLoading}
					text={status === PropertyStatus.ACTIVE ? t('You have no cars for sale yet.') : t('No cars in this list yet.')}
					actionLabel={status === PropertyStatus.ACTIVE ? t('Add your first car') : undefined}
					actionHref={'/mypage?category=addProperty'}
				/>
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
			propertyStatus: 'ACTIVE',
		},
	},
};

export default MyCars;
