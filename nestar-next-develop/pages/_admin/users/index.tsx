import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import Swal from 'sweetalert2';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { MemberPanelList } from '../../../libs/components/admin/users/MemberList';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetConfirmAlert, sweetTopSmallSuccessAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { MemberUpdate } from '../../../libs/types/member/member.update';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { useMutation, useQuery } from '@apollo/client/react';
import ReasonDialog from '../../../libs/components/admin/ReasonDialog';
import { AdminPager, AdminSearch, AdminSelect, AdminTabs, searchArea, tableWrap } from '../../../libs/components/admin/ui';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminUsers: NextPage = ({ initialInquiry = defaultProps.initialInquiry, ...props }: any) => {
	const { t } = useTranslation('common');
	const [membersInquiry, setMembersInquiry] = useState<MembersInquiry>(initialInquiry);
	const [members, setMembers] = useState<Member[]>([]);
	const [membersTotal, setMembersTotal] = useState<number>(0);
	const [value, setValue] = useState(
		membersInquiry?.search?.memberStatus ? membersInquiry?.search?.memberStatus : 'ALL',
	);
	const [searchText, setSearchText] = useState('');
	const [searchType, setSearchType] = useState('ALL');
	// member waiting for a block reason
	const [blockTarget, setBlockTarget] = useState<Member | null>(null);

	/** APOLLO REQUESTS **/
	const [updateMemberByAdmin] = useMutation<any>(UPDATE_MEMBER_BY_ADMIN);

	const {
		loading: getAllMembersByAdminLoading,
		data: getAllMembersByAdminData,
		error: getAllMembersByAdminError,
		refetch: getAllMembersRefetch,
	} = useQuery<any>(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getAllMembersByAdminData) return;
		const data: any = getAllMembersByAdminData;
		setMembers(data?.getAllMembersByAdmin?.list);
		setMembersTotal(data?.getAllMembersByAdmin?.metaCounter[0]?.total ?? 0);
	}, [getAllMembersByAdminData]);

	/** LIFECYCLES **/
	// the search box in the top bar sends ?q=
	const router = useRouter();
	useEffect(() => {
		if (router.isReady && typeof router.query.q === 'string') setSearchText(router.query.q);
	}, [router.isReady, router.query.q]);

	// nick, name or phone; searched after the admin stops typing
	useEffect(() => {
		const timer = setTimeout(() => {
			const text = searchText.trim();
			if ((membersInquiry.search.text ?? '') === text) return;
			setMembersInquiry({ ...membersInquiry, page: 1, search: { ...membersInquiry.search, text: text || undefined } });
		}, 400);
		return () => clearTimeout(timer);
	}, [searchText]);

	/** HANDLERS **/
	const changePageHandler = async (newPage: number) => {
		membersInquiry.page = newPage;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const changeRowsPerPageHandler = async (limit: number) => {
		membersInquiry.limit = limit;
		membersInquiry.page = 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const tabChangeHandler = async (newValue: string) => {
		setValue(newValue);
		setSearchText('');

		setMembersInquiry({ ...membersInquiry, page: 1, sort: 'createdAt' });

		switch (newValue) {
			case 'ACTIVE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.ACTIVE } });
				break;
			case 'BLOCK':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.BLOCK } });
				break;
			case 'DELETE':
				setMembersInquiry({ ...membersInquiry, search: { memberStatus: MemberStatus.DELETE } });
				break;
			default:
				delete membersInquiry?.search?.memberStatus;
				setMembersInquiry({ ...membersInquiry });
				break;
		}
	};

	/** blocking needs a reason, deleting and giving admin rights need a confirmation */
	const updateMemberHandler = async (updateData: MemberUpdate) => {
		const member = members.find((item) => item._id === updateData._id);
		if (updateData.memberStatus === MemberStatus.BLOCK && !updateData.memberBlockReason) {
			setBlockTarget(member ?? null);
			return;
		}
		if (
			updateData.memberStatus === MemberStatus.DELETE &&
			!(await sweetConfirmAlert(t('Delete this account?') as string))
		)
			return;
		if (
			updateData.memberType === MemberType.ADMIN &&
			!(await sweetConfirmAlert(t('Give admin rights (moderator) to this member?') as string))
		)
			return;
		try {
			await updateMemberByAdmin({
				variables: {
					input: updateData,
				},
			});

			await getAllMembersRefetch({ input: membersInquiry });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// support flow for "I forgot my password": admin sets a temporary password and tells the member
	const resetPasswordHandler = async (id: string, nick: string) => {
		const { value: memberPassword } = await Swal.fire({
			title: `${t('New password for')} ${nick}`,
			input: 'text',
			inputPlaceholder: t('5-12 characters') as string,
			showCancelButton: true,
			inputValidator: (value: string) =>
				!value || value.length < 5 || value.length > 12 ? (t('Password must be 5-12 characters') as string) : null,
		});
		if (!memberPassword) return;
		try {
			await updateMemberByAdmin({ variables: { input: { _id: id, memberPassword } } });
			await sweetTopSmallSuccessAlert(t('Password updated') as string, 1000);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const textHandler = useCallback((value: string) => {
		try {
			setSearchText(value);
		} catch (err: any) {}
	}, []);

	const searchTypeHandler = async (newValue: string) => {
		try {
			setSearchType(newValue);

			if (newValue !== 'ALL') {
				setMembersInquiry({
					...membersInquiry,
					page: 1,
					sort: 'createdAt',
					search: {
						...membersInquiry.search,
						memberType: newValue as MemberType,
					},
				});
			} else {
				delete membersInquiry?.search?.memberType;
				setMembersInquiry({ ...membersInquiry });
			}
		} catch (err: any) {}
	};

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader
				title={t('Members')}
				description={
					t('Find a member by nick, name or phone. Open a member to see their cars, reports and chats.') as string
				}
			/>
			<div className={tableWrap}>
				<AdminTabs
					value={value}
					onChange={tabChangeHandler}
					items={[
						{ value: 'ALL', label: t('All') },
						{ value: 'ACTIVE', label: t('Active') },
						{ value: 'BLOCK', label: t('Blocked') },
						{ value: 'DELETE', label: t('Deleted') },
					]}
				/>
				<div className={searchArea}>
					<AdminSearch value={searchText} onChange={textHandler} placeholder={t('Nickname, name or phone') as string} />
					<AdminSelect
						className="md:w-40"
						value={searchType}
						onChange={searchTypeHandler}
						options={[
							{ value: 'ALL', label: t('All types') },
							{ value: 'USER', label: t('Private sellers') },
							{ value: 'AGENT', label: t('Dealers') },
							{ value: 'ADMIN', label: t('Admins') },
						]}
					/>
				</div>
				<MemberPanelList members={members} updateMemberHandler={updateMemberHandler} resetPasswordHandler={resetPasswordHandler} />
				<AdminPager
					total={membersTotal}
					page={membersInquiry?.page}
					limit={membersInquiry?.limit}
					onPage={changePageHandler}
					onLimit={changeRowsPerPageHandler}
				/>
			</div>
			<ReasonDialog
				open={!!blockTarget}
				title={`${t('Block')} ${blockTarget?.memberNick ?? ''}`}
				description={t('The member is logged out everywhere and sees this reason when trying to log in.') as string}
				presets={['Fraud or fake listings', 'Spam', 'Insulting other members', 'Selling forbidden goods']}
				confirmLabel={t('Block')}
				onConfirm={(reason) => {
					const id = blockTarget?._id ?? '';
					setBlockTarget(null);
					updateMemberHandler({ _id: id, memberStatus: MemberStatus.BLOCK, memberBlockReason: reason });
				}}
				onClose={() => setBlockTarget(null)}
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
		search: {},
	},
};

export default withAdminLayout(AdminUsers);
