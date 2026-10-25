import React, { useState } from 'react';
import { NextPage } from 'next';
import { Pagination } from '@mui/material';
import { useTranslation } from 'next-i18next';
import ManageCarRow from './ManageCarRow';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Property } from '../../types/property/property';
import { AgentPropertiesInquiry } from '../../types/property/property.input';
import { T } from '../../types/common';
import { PropertyStatus } from '../../enums/property.enum';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import { GET_AGENT_PROPERTIES } from '../../../apollo/user/query';
import { UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

const MyProperties: NextPage = ({ initialInput, ...props }: any) => {
	const { t } = useTranslation('common');
	const [searchFilter, setSearchFilter] = useState<AgentPropertiesInquiry>(initialInput);
	const [agentProperties, setAgentProperties] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/** APOLLO REQUESTS **/
	const [updateProperty] = useMutation(UPDATE_PROPERTY);

	const {
		loading: getAgentPropertiesLoading,
		data: getAgentPropertiesData,
		error: getAgentPropertiesError,
		refetch: getAgentPropertiesRefetch,
	} = useQuery(GET_AGENT_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAgentProperties(data?.getAgentProperties?.list);
			setTotal(data?.getAgentProperties?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const paginationHandler = (e: T, value: number) => {
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
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('My Cars')}</h1>
					<p>{t('Manage your listings, mark cars as sold or edit details.')}</p>
				</div>
				<button className={'ma-btn ma-btn--primary'} onClick={() => router.push('/mypage?category=addProperty')}>
					+ {t('Add Car')}
				</button>
			</div>

			<div className={'ma-tabs ma-tabs--underline'}>
				<button
					className={`ma-tab ${status === PropertyStatus.ACTIVE ? 'is-active' : ''}`}
					onClick={() => changeStatusHandler(PropertyStatus.ACTIVE)}
				>
					{t('For sale')}
				</button>
				<button
					className={`ma-tab ${status === PropertyStatus.SOLD ? 'is-active' : ''}`}
					onClick={() => changeStatusHandler(PropertyStatus.SOLD)}
				>
					{t('Sold')}
				</button>
			</div>

			{agentProperties?.length ? (
				<div className={'ma-manage-list'}>
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
				<div className={'ma-empty'}>{getAgentPropertiesLoading ? t('Loading...') : t('No cars in this list yet.')}</div>
			)}

			{total > searchFilter.limit && (
				<div className={'ma-pagination'}>
					<Pagination
						count={Math.ceil(total / searchFilter.limit)}
						page={searchFilter.page}
						shape="rounded"
						onChange={paginationHandler}
					/>
				</div>
			)}
		</div>
	);
};

MyProperties.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		search: {
			propertyStatus: 'ACTIVE',
		},
	},
};

export default MyProperties;
