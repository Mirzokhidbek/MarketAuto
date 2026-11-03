import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { adminButton, AdminPager, AdminSearch, AdminSelect, AdminTabs, pill, searchArea, tableWrap } from '../../../libs/components/admin/ui';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import ReasonDialog from '../../../libs/components/admin/ReasonDialog';
import { userVar } from '../../../apollo/store';
import { PropertyPanelList } from '../../../libs/components/admin/properties/PropertyList';
import { AllPropertiesInquiry } from '../../../libs/types/property/property.input';
import { Property } from '../../../libs/types/property/property';
import { CarBrand, CarCountry, PropertyStatus } from '../../../libs/enums/property.enum';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { PropertyUpdate } from '../../../libs/types/property/property.update';
import { GET_ALL_PROPERTIES_BY_ADMIN } from '../../../apollo/admin/query';
import {
	BULK_MODERATE_BY_ADMIN,
	REMOVE_PROPERTY_BY_ADMIN,
	UPDATE_PROPERTY_BY_ADMIN,
} from '../../../apollo/admin/mutation';
import { formatEnumLabel } from '../../../libs/utils';
import { T } from '../../../libs/types/common';
import { CloseIcon } from '../../../libs/components/ui/icons';

// ready-made rejection reasons (translation keys), the admin can still edit the text
const REJECT_PRESETS = [
	'Photos are of poor quality or not of this car',
	'Price looks unrealistic',
	'Description is incomplete or misleading',
	'Contact details in photos or text',
	'Duplicate listing',
];

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminProperties: NextPage = ({ initialInquiry = defaultProps.initialInquiry, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [propertiesInquiry, setPropertiesInquiry] = useState<AllPropertiesInquiry>(initialInquiry);
	const [properties, setProperties] = useState<Property[]>([]);
	const [propertiesTotal, setPropertiesTotal] = useState<number>(0);
	const [value, setValue] = useState(propertiesInquiry?.search?.propertyStatus ?? 'ALL');
	const [searchText, setSearchText] = useState<string>('');
	const [selected, setSelected] = useState<string[]>([]);
	// ids waiting for a rejection reason (one car or a bulk selection)
	const [rejectIds, setRejectIds] = useState<string[]>([]);
	const user = useReactiveVar(userVar);
	const isSuper = user.memberAdminRole !== 'MODERATOR';
	const memberFilter = (router.query.memberId as string) || '';

	/** APOLLO REQUESTS **/
	const [updatePropertyByAdmin] = useMutation<any>(UPDATE_PROPERTY_BY_ADMIN);
	const [removePropertyByAdmin] = useMutation<any>(REMOVE_PROPERTY_BY_ADMIN);
	const [bulkModerateByAdmin] = useMutation<any>(BULK_MODERATE_BY_ADMIN);

	const {
		data: completedData1,
		loading,
		refetch: getAllPropertiesByAdminRefetch,
	} = useQuery<any>(GET_ALL_PROPERTIES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: propertiesInquiry },
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!completedData1) return;
		const data: any = completedData1;
		setProperties(data?.getAllPropertiesByAdmin?.list ?? []);
		setPropertiesTotal(data?.getAllPropertiesByAdmin?.metaCounter[0]?.total ?? 0);
		setSelected([]);
	}, [completedData1]);

	/** LIFECYCLES **/
	// dashboard links straight to a tab, e.g. ?status=PENDING
	useEffect(() => {
		const status = router.query.status as string;
		if (router.isReady && status && status !== value) tabChangeHandler(status);
	}, [router.isReady, router.query.status]);

	// the search box in the top bar sends ?q=
	useEffect(() => {
		if (router.isReady && typeof router.query.q === 'string') setSearchText(router.query.q);
	}, [router.isReady, router.query.q]);

	// member card links here with ?memberId= to show all cars of one seller
	useEffect(() => {
		if (router.isReady && (propertiesInquiry.search.memberId ?? '') !== memberFilter)
			updateSearch({ memberId: memberFilter || undefined });
	}, [router.isReady, memberFilter]);

	// search by title after the admin stops typing
	useEffect(() => {
		const timer = setTimeout(() => updateSearch({ text: searchText.trim() || undefined }), 400);
		return () => clearTimeout(timer);
	}, [searchText]);

	/** HANDLERS **/
	const updateSearch = (patch: T) => {
		// functional update: several filters can arrive from the URL in the same render
		setPropertiesInquiry((prev) => {
			const search: T = { ...prev.search, ...patch };
			Object.keys(search).forEach((key) => {
				if (search[key] === undefined) delete search[key];
			});
			return { ...prev, page: 1, search };
		});
	};

	const changePageHandler = (newPage: number) => {
		setPropertiesInquiry({ ...propertiesInquiry, page: newPage });
	};

	const changeRowsPerPageHandler = (limit: number) => {
		setPropertiesInquiry({ ...propertiesInquiry, page: 1, limit });
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

	// rejection always asks for a reason: the seller sees it and can fix the listing
	const changeStatusHandler = async (property: Property, status: PropertyStatus) => {
		if (status === property.propertyStatus) return;
		if (status === PropertyStatus.REJECTED) return setRejectIds([property._id]);
		if (status === PropertyStatus.DELETE && !(await sweetConfirmAlert(t('Delete this listing?') as string))) return;
		await updatePropertyHandler({ _id: property._id, propertyStatus: status });
	};

	const bulkApproveHandler = async () => {
		try {
			const { data } = await bulkModerateByAdmin({
				variables: { input: { ids: selected, propertyStatus: PropertyStatus.ACTIVE } },
			});
			await sweetTopSmallSuccessAlert(`${t('Done')}: ${data?.bulkModerateByAdmin ?? 0}`, 900);
			await getAllPropertiesByAdminRefetch({ input: propertiesInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const rejectConfirmHandler = async (reason: string) => {
		const ids = rejectIds;
		setRejectIds([]);
		if (ids.length === 1)
			await updatePropertyHandler({
				_id: ids[0],
				propertyStatus: PropertyStatus.REJECTED,
				propertyRejectReason: reason,
			});
		else {
			try {
				await bulkModerateByAdmin({
					variables: { input: { ids, propertyStatus: PropertyStatus.REJECTED, propertyRejectReason: reason } },
				});
				await getAllPropertiesByAdminRefetch({ input: propertiesInquiry });
			} catch (err: any) {
				sweetErrorHandling(err).then();
			}
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
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader
				title={t('Cars')}
				description={t('Approve new listings, reject them with a reason, or change the status of any car.') as string}
			/>
			<div className={tableWrap}>
				<AdminTabs
					value={value}
					onChange={tabChangeHandler}
					items={(
						['ALL', PropertyStatus.PENDING, PropertyStatus.REJECTED, PropertyStatus.ACTIVE, PropertyStatus.SOLD, PropertyStatus.DELETE] as string[]
					).map((status) => ({
						value: status,
						label: t(
							{
								ALL: 'All',
								PENDING: 'Under review',
								REJECTED: 'Rejected',
								ACTIVE: 'Active',
								SOLD: 'Sold',
								DELETE: 'Deleted',
							}[status] as string,
						),
					}))}
				/>
				<div className={searchArea}>
					<AdminSearch value={searchText} onChange={setSearchText} placeholder={t('Search by title') as string} />
					<AdminSelect
						className="md:w-[180px]"
						value={propertiesInquiry.search.countryList?.[0] ?? 'ALL'}
						onChange={(country) => updateSearch({ countryList: country === 'ALL' ? undefined : [country as CarCountry] })}
						options={[
							{ value: 'ALL', label: t('All countries') },
							...Object.values(CarCountry).map((country) => ({ value: country, label: formatEnumLabel(country) })),
						]}
					/>
					<AdminSelect
						className="md:w-[180px]"
						value={propertiesInquiry.search.brandList?.[0] ?? 'ALL'}
						onChange={(brand) => updateSearch({ brandList: brand === 'ALL' ? undefined : [brand as CarBrand] })}
						options={[
							{ value: 'ALL', label: t('All brands') },
							...Object.values(CarBrand).map((brand) => ({ value: brand, label: formatEnumLabel(brand) })),
						]}
					/>
				</div>
				{memberFilter && (
					<div className="mx-4 mb-4 md:mx-6">
						<button
							type="button"
							className={pill('neutral', 'cursor-pointer border-0')}
							onClick={() => router.push('/_admin/properties', undefined, { shallow: true })}
						>
							{t('Seller')}: {properties[0]?.memberData?.memberNick ?? '…'}
							<CloseIcon className="text-sm" />
						</button>
					</div>
				)}
				{selected.length > 0 && (
					<div className="flex flex-wrap items-center gap-3 border-y border-[#edf0f6] bg-[#e9f0ff] px-4 py-3 text-sm md:px-6">
						<strong>
							{t('Selected')}: {selected.length}
						</strong>
						<button className={adminButton({ size: 'sm', color: 'success' })} onClick={bulkApproveHandler}>
							{t('Approve')}
						</button>
						<button className={adminButton({ size: 'sm', variant: 'outlined', color: 'error' })} onClick={() => setRejectIds(selected)}>
							{t('Reject')}
						</button>
						<button className={adminButton({ size: 'sm', variant: 'text' })} onClick={() => setSelected([])}>
							{t('Cancel')}
						</button>
					</div>
				)}
				<PropertyPanelList
					properties={properties}
					loading={loading}
					selected={selected}
					onSelect={setSelected}
					sellerHref={(memberId) => (isSuper ? `/_admin/users/detail?id=${memberId}` : `/member?memberId=${memberId}`)}
					changeStatusHandler={changeStatusHandler}
					removePropertyHandler={removePropertyHandler}
				/>
				<AdminPager
					total={propertiesTotal}
					page={propertiesInquiry?.page}
					limit={propertiesInquiry?.limit}
					onPage={changePageHandler}
					onLimit={changeRowsPerPageHandler}
				/>
			</div>
			<ReasonDialog
				open={rejectIds.length > 0}
				title={rejectIds.length > 1 ? `${t('Reject listings')} (${rejectIds.length})` : t('Reject listing')}
				description={t('The seller will see this reason and can fix the listing and send it again.') as string}
				presets={REJECT_PRESETS}
				confirmLabel={t('Reject')}
				onConfirm={rejectConfirmHandler}
				onClose={() => setRejectIds([])}
			/>
		</div>
	);
};

// React 19 has no defaultProps on function components: used as the default value below
const defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminProperties);
