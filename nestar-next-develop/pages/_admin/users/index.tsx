import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Swal from 'sweetalert2';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { MemberPanelList } from '../../../libs/components/admin/users/MemberList';
import { Box, InputAdornment, List, ListItem, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { TabContext } from '@mui/lab';
import OutlinedInput from '@mui/material/OutlinedInput';
import TablePagination from '@mui/material/TablePagination';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { MembersInquiry } from '../../../libs/types/member/member.input';
import { Member } from '../../../libs/types/member/member';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetConfirmAlert, sweetTopSmallSuccessAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { MemberUpdate } from '../../../libs/types/member/member.update';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { useMutation, useQuery } from '@apollo/client';
import ReasonDialog from '../../../libs/components/admin/ReasonDialog';
import { T } from '../../../libs/types/common';


export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminUsers: NextPage = ({ initialInquiry, ...props }: any) => {
	const { t } = useTranslation('common');
	const [anchorEl, setAnchorEl] = useState<[] | HTMLElement[]>([]);
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
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);

	const {
		loading: getAllMembersByAdminLoading,
		data: getAllMembersByAdminData,
		error: getAllMembersByAdminError,
		refetch: getAllMembersRefetch,
	} = useQuery(GET_ALL_MEMBERS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: membersInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setMembers(data?.getAllMembersByAdmin?.list);
			setMembersTotal(data?.getAllMembersByAdmin?.metaCounter[0]?.total ?? 0);
		},
	});

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
	const changePageHandler = async (event: unknown, newPage: number) => {
		membersInquiry.page = newPage + 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const changeRowsPerPageHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		membersInquiry.limit = parseInt(event.target.value, 10);
		membersInquiry.page = 1;
		await getAllMembersRefetch({ input: membersInquiry });
		setMembersInquiry({ ...membersInquiry });
	};

	const menuIconClickHandler = (e: any, index: number) => {
		const tempAnchor = anchorEl.slice();
		tempAnchor[index] = e.currentTarget;
		setAnchorEl(tempAnchor);
	};

	const menuIconCloseHandler = () => {
		setAnchorEl([]);
	};

	const tabChangeHandler = async (event: any, newValue: string) => {
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
			menuIconCloseHandler();
			setBlockTarget(member ?? null);
			return;
		}
		if (updateData.memberStatus === MemberStatus.DELETE && !(await sweetConfirmAlert(t('Delete this account?') as string))) return;
		if (updateData.memberType === MemberType.ADMIN && !(await sweetConfirmAlert(t('Give admin rights (moderator) to this member?') as string)))
			return;
		try {
			await updateMemberByAdmin({
				variables: {
					input: updateData,
				},
			});

			menuIconCloseHandler();
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
		} catch (err: any) {
		}
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
		} catch (err: any) {
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<AdminPageHeader title={t('Members')} description={t('Find a member by nick, name or phone. Open a member to see their cars, reports and chats.') as string} />
			<Box component={'div'} className={'table-wrap'}>
				<Box component={'div'} sx={{ width: '100%', typography: 'body1' }}>
					<TabContext value={value}>
						<Box component={'div'}>
							<List className={'tab-menu'}>
								<ListItem
									onClick={(e: React.MouseEvent) => tabChangeHandler(e, 'ALL')}
									value="ALL"
									className={value === 'ALL' ? 'li on' : 'li'}
								>
									{t('All')}
								</ListItem>
								<ListItem
									onClick={(e: React.MouseEvent) => tabChangeHandler(e, 'ACTIVE')}
									value="ACTIVE"
									className={value === 'ACTIVE' ? 'li on' : 'li'}
								>
									{t('Active')}
								</ListItem>
								<ListItem
									onClick={(e: React.MouseEvent) => tabChangeHandler(e, 'BLOCK')}
									value="BLOCK"
									className={value === 'BLOCK' ? 'li on' : 'li'}
								>
									{t('Blocked')}
								</ListItem>
								<ListItem
									onClick={(e: React.MouseEvent) => tabChangeHandler(e, 'DELETE')}
									value="DELETE"
									className={value === 'DELETE' ? 'li on' : 'li'}
								>
									{t('Deleted')}
								</ListItem>
							</List>
							<Divider />
							<Stack className={'search-area'} sx={{ m: '24px' }}>
								<OutlinedInput
									value={searchText}
									onChange={(e: any) => textHandler(e.target.value)}
									sx={{ width: '100%' }}
									className={'search'}
									placeholder={t('Nickname, name or phone') as string}
									endAdornment={
										<>
											{searchText && (
												<CancelRoundedIcon style={{ cursor: 'pointer' }} onClick={() => setSearchText('')} />
											)}
											<InputAdornment position="end">
												<img src="/img/icons/search_icon.png" alt={'searchIcon'} />
											</InputAdornment>
										</>
									}
								/>
								<Select sx={{ width: '160px', ml: '20px' }} value={searchType}>
									<MenuItem value={'ALL'} onClick={() => searchTypeHandler('ALL')}>
										{t('All types')}
									</MenuItem>
									<MenuItem value={'USER'} onClick={() => searchTypeHandler('USER')}>
										{t('Private sellers')}
									</MenuItem>
									<MenuItem value={'AGENT'} onClick={() => searchTypeHandler('AGENT')}>
										{t('Dealers')}
									</MenuItem>
									<MenuItem value={'ADMIN'} onClick={() => searchTypeHandler('ADMIN')}>
										{t('Admins')}
									</MenuItem>
								</Select>
							</Stack>
							<Divider />
						</Box>
						<MemberPanelList
							members={members}
							anchorEl={anchorEl}
							menuIconClickHandler={menuIconClickHandler}
							menuIconCloseHandler={menuIconCloseHandler}
							updateMemberHandler={updateMemberHandler}
							resetPasswordHandler={resetPasswordHandler}
						/>

						<TablePagination
							labelRowsPerPage={t('Rows per page')}
							labelDisplayedRows={({ from, to, count }: any) => `${from}–${to} / ${count}`}
							rowsPerPageOptions={[10, 20, 40, 60]}
							component="div"
							count={membersTotal}
							rowsPerPage={membersInquiry?.limit}
							page={membersInquiry?.page - 1}
							onPageChange={changePageHandler}
							onRowsPerPageChange={changeRowsPerPageHandler}
						/>
					</TabContext>
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
				</Box>
			</Box>
		</Box>
	);
};

AdminUsers.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		search: {},
	},
};

export default withAdminLayout(AdminUsers);
