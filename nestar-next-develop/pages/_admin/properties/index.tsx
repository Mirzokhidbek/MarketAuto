import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import {
	Box,
	Divider,
	InputAdornment,
	List,
	ListItem,
	MenuItem,
	OutlinedInput,
	Select,
	Stack,
	TablePagination,
	Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation, useQuery } from '@apollo/client';
import { PropertyPanelList } from '../../../libs/components/admin/properties/PropertyList';
import { AllPropertiesInquiry } from '../../../libs/types/property/property.input';
import { Property } from '../../../libs/types/property/property';
import { CarBrand, CarCountry, PropertyStatus } from '../../../libs/enums/property.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { PropertyUpdate } from '../../../libs/types/property/property.update';
import { GET_ALL_PROPERTIES_BY_ADMIN } from '../../../apollo/admin/query';
import { REMOVE_PROPERTY_BY_ADMIN, UPDATE_PROPERTY_BY_ADMIN } from '../../../apollo/admin/mutation';
import { formatEnumLabel } from '../../../libs/utils';
import { T } from '../../../libs/types/common';


export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminProperties: NextPage = ({ initialInquiry, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [propertiesInquiry, setPropertiesInquiry] = useState<AllPropertiesInquiry>(initialInquiry);
	const [properties, setProperties] = useState<Property[]>([]);
	const [propertiesTotal, setPropertiesTotal] = useState<number>(0);
	const [value, setValue] = useState(propertiesInquiry?.search?.propertyStatus ?? 'ALL');
	const [searchText, setSearchText] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [updatePropertyByAdmin] = useMutation(UPDATE_PROPERTY_BY_ADMIN);
	const [removePropertyByAdmin] = useMutation(REMOVE_PROPERTY_BY_ADMIN);

	const { loading, refetch: getAllPropertiesByAdminRefetch } = useQuery(GET_ALL_PROPERTIES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: propertiesInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setProperties(data?.getAllPropertiesByAdmin?.list ?? []);
			setPropertiesTotal(data?.getAllPropertiesByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	// dashboard links straight to a tab, e.g. ?status=PENDING
	useEffect(() => {
		const status = router.query.status as string;
		if (router.isReady && status && status !== value) tabChangeHandler(status);
	}, [router.isReady, router.query.status]);


	// search by title after the admin stops typing
	useEffect(() => {
		const timer = setTimeout(() => updateSearch({ text: searchText.trim() || undefined }), 400);
		return () => clearTimeout(timer);
	}, [searchText]);

	/** HANDLERS **/
	const updateSearch = (patch: T) => {
		const search: T = { ...propertiesInquiry.search, ...patch };
		Object.keys(search).forEach((key) => {
			if (search[key] === undefined) delete search[key];
		});
		setPropertiesInquiry({ ...propertiesInquiry, page: 1, search });
	};

	const changePageHandler = (event: unknown, newPage: number) => {
		setPropertiesInquiry({ ...propertiesInquiry, page: newPage + 1 });
	};

	const changeRowsPerPageHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPropertiesInquiry({ ...propertiesInquiry, page: 1, limit: parseInt(event.target.value, 10) });
	};

	const tabChangeHandler = (newValue: string) => {
		setValue(newValue);
		updateSearch({ propertyStatus: newValue === 'ALL' ? undefined : (newValue as PropertyStatus) });
	};

	const updatePropertyHandler = async (updateData: PropertyUpdate) => {
		try {
			await updatePropertyByAdmin({ variables: { input: updateData } });
			await getAllPropertiesByAdminRefetch({ input: propertiesInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const removePropertyHandler = async (id: string) => {
		try {
			if (await sweetConfirmAlert(t('Remove this car permanently?') as string)) {
				await removePropertyByAdmin({ variables: { input: id } });
				await getAllPropertiesByAdminRefetch({ input: propertiesInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('Car List')}
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{['ALL', PropertyStatus.PENDING, PropertyStatus.ACTIVE, PropertyStatus.SOLD, PropertyStatus.DELETE].map((status) => (
						<ListItem key={status} onClick={() => tabChangeHandler(status)} className={value === status ? 'li on' : 'li'}>
							{t({ ALL: 'All', PENDING: 'Under review', ACTIVE: 'Active', SOLD: 'Sold', DELETE: 'Deleted' }[status] as string)}
						</ListItem>
					))}
				</List>
				<Divider />
				<Stack className={'search-area'} sx={{ m: '24px' }} direction={'row'} gap={2}>
					<OutlinedInput
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						sx={{ flex: 1 }}
						className={'search'}
						placeholder={t('Search by title') as string}
						endAdornment={
							<InputAdornment position="end">
								<SearchIcon />
							</InputAdornment>
						}
					/>
					<Select
						sx={{ width: '180px' }}
						value={propertiesInquiry.search.countryList?.[0] ?? 'ALL'}
						onChange={(e) =>
							updateSearch({ countryList: e.target.value === 'ALL' ? undefined : [e.target.value as CarCountry] })
						}
					>
						<MenuItem value={'ALL'}>{t('All countries')}</MenuItem>
						{Object.values(CarCountry).map((country) => (
							<MenuItem value={country} key={country}>
								{formatEnumLabel(country)}
							</MenuItem>
						))}
					</Select>
					<Select
						sx={{ width: '180px' }}
						value={propertiesInquiry.search.brandList?.[0] ?? 'ALL'}
						onChange={(e) =>
							updateSearch({ brandList: e.target.value === 'ALL' ? undefined : [e.target.value as CarBrand] })
						}
					>
						<MenuItem value={'ALL'}>{t('All brands')}</MenuItem>
						{Object.values(CarBrand).map((brand) => (
							<MenuItem value={brand} key={brand}>
								{formatEnumLabel(brand)}
							</MenuItem>
						))}
					</Select>
				</Stack>
				<Divider />
				<PropertyPanelList
					properties={properties}
					loading={loading}
					updatePropertyHandler={updatePropertyHandler}
					removePropertyHandler={removePropertyHandler}
				/>

				<TablePagination
					rowsPerPageOptions={[10, 20, 40, 60]}
					component="div"
					count={propertiesTotal}
					rowsPerPage={propertiesInquiry?.limit}
					page={propertiesTotal ? propertiesInquiry?.page - 1 : 0}
					onPageChange={changePageHandler}
					onRowsPerPageChange={changeRowsPerPageHandler}
				/>
			</Box>
		</Box>
	);
};

AdminProperties.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminProperties);
