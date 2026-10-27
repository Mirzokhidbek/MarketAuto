import { useTranslation } from 'next-i18next';
import { imageUrl } from '../../../utils';
import React from 'react';
import Link from 'next/link';
import {
	TableCell,
	TableHead,
	TableBody,
	TableRow,
	Table,
	TableContainer,
	Button,
	Menu,
	Fade,
	MenuItem,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Typography from '@mui/material/Typography';
import { Stack, Switch } from '@mui/material';
import { Member } from '../../../types/member/member';
import { MemberStatus, MemberType } from '../../../enums/member.enum';

interface Data {
	id: string;
	nickname: string;
	fullname: string;
	phone: string;
	type: string;
	state: string;
	warning: string;
	block: string;
	actions: string;
	dealer: string;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
	if (b[orderBy] < a[orderBy]) {
		return -1;
	}
	if (b[orderBy] > a[orderBy]) {
		return 1;
	}
	return 0;
}

type Order = 'asc' | 'desc';

interface HeadCell {
	/** shown as a tooltip with an (i) icon: what the switch in this column does */
	hint?: string;
	disablePadding: boolean;
	id: keyof Data;
	label: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'nickname',
		numeric: true,
		disablePadding: false,
		label: 'NICKNAME',
	},
	{
		id: 'fullname',
		numeric: false,
		disablePadding: false,
		label: 'FULL NAME',
	},
	{
		id: 'phone',
		numeric: true,
		disablePadding: false,
		label: 'PHONE',
	},
	{
		id: 'type',
		numeric: false,
		disablePadding: false,
		label: 'MEMBER TYPE',
	},
	{
		id: 'warning',
		numeric: false,
		disablePadding: false,
		label: 'PHONE CONFIRMED',
		hint: 'The member confirmed this phone with an SMS code',
	},
	{
		id: 'block',
		numeric: false,
		disablePadding: false,
		label: 'TRUSTED',
		hint: 'Trusted sellers publish without moderation. Given automatically after the first approved car.',
	},
	{
		id: 'dealer',
		numeric: false,
		disablePadding: false,
		label: 'VERIFIED DEALER',
		hint: 'You checked the dealership documents. Buyers see a "Verified dealer" badge.',
	},
	{
		id: 'state',
		numeric: false,
		disablePadding: false,
		label: 'STATUS',
	},
	{
		id: 'actions',
		numeric: false,
		disablePadding: false,
		label: 'ACTIONS',
	},
];

interface EnhancedTableProps {
	numSelected: number;
	onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
	onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
	order: Order;
	orderBy: string;
	rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
	const { t } = useTranslation('common');
	const { onSelectAllClick } = props;

	return (
		<TableHead>
			<TableRow>
				{headCells.map((headCell) => (
					<TableCell
						key={headCell.id}
						align={headCell.numeric ? 'left' : 'center'}
						padding={headCell.disablePadding ? 'none' : 'normal'}
					>
						{headCell.hint ? (
							<Tooltip title={t(headCell.hint) as string} arrow>
								<span className={'ma-admin-th-hint'}>
									{t(headCell.label)} <InfoOutlinedIcon />
								</span>
							</Tooltip>
						) : (
							t(headCell.label)
						)}
					</TableCell>
				))}
			</TableRow>
		</TableHead>
	);
}

interface MemberPanelListType {
	members: Member[];
	resetPasswordHandler: (id: string, nick: string) => void;
	anchorEl: any;
	menuIconClickHandler: any;
	menuIconCloseHandler: any;
	updateMemberHandler: any;
}

export const MemberPanelList = (props: MemberPanelListType) => {
	const { t } = useTranslation('common');
	const { members, anchorEl, menuIconClickHandler, menuIconCloseHandler, updateMemberHandler, resetPasswordHandler } =
		props;

	return (
		<Stack>
			<TableContainer>
				<Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
					{/*@ts-ignore*/}
					<EnhancedTableHead />
					<TableBody>
						{members.length === 0 && (
							<TableRow>
								<TableCell align="center" colSpan={10}>
									<span className={'no-data'}>{t('No members found')}</span>
								</TableCell>
							</TableRow>
						)}

						{members.length !== 0 &&
							members.map((member: Member, index: number) => {
								const member_image = member.memberImage
									? imageUrl(member.memberImage)
									: '/img/profile/defaultUser.svg';
								return (
									<TableRow hover key={member?._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>

										<TableCell align="left" className={'name'}>
											<Stack direction={'row'}>
												<Link href={`/_admin/users/detail?id=${member._id}`}>
													<div>
														<Avatar alt={member.memberNick} src={member_image} sx={{ ml: '2px', mr: '10px' }} />
													</div>
												</Link>
												<Link href={`/_admin/users/detail?id=${member._id}`}>
													<div>
														{member.memberNick}
														{member.memberType === 'ADMIN' && member.memberAdminRole && (
															<Typography variant="caption" display="block" color="text.secondary">
																{t(`role_${member.memberAdminRole}`)}
															</Typography>
														)}
													</div>
												</Link>
											</Stack>
										</TableCell>

										<TableCell align="center">{member.memberFullName || '—'}</TableCell>
										<TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>{member.memberPhone ? `+${member.memberPhone}` : '—'}</TableCell>

										<TableCell align="center">
											<Button onClick={(e: any) => menuIconClickHandler(e, index)} className={'badge success'}>
												{t(`member_${member.memberType}`)}
											</Button>

											<Menu
												className={'menu-modal'}
												MenuListProps={{
													'aria-labelledby': 'fade-button',
												}}
												anchorEl={anchorEl[index]}
												open={Boolean(anchorEl[index])}
												onClose={menuIconCloseHandler}
												TransitionComponent={Fade}
												sx={{ p: 1 }}
											>
												{Object.values(MemberType)
													.filter((ele) => ele !== member?.memberType)
													.map((type: string) => (
														<MenuItem
															onClick={() => updateMemberHandler({ _id: member._id, memberType: type })}
															key={type}
														>
															<Typography variant={'subtitle1'} component={'span'}>
																{t(`member_${type}`)}
															</Typography>
														</MenuItem>
													))}
											</Menu>
										</TableCell>

										<TableCell align="center">{member.memberPhoneVerified ? '✓' : '—'}</TableCell>
										<TableCell align="center">
											{/* trusted sellers publish without moderation */}
											<Switch
												size="small"
												checked={!!member.memberTrusted}
												disabled={member.memberType === 'ADMIN'}
												onChange={(e) => updateMemberHandler({ _id: member._id, memberTrusted: e.target.checked })}
											/>
										</TableCell>
										<TableCell align="center">
											{/* documents of the dealership were checked by the admin */}
											<Switch
												size="small"
												checked={!!member.memberDealerVerified}
												disabled={member.memberType !== 'AGENT'}
												onChange={(e) => updateMemberHandler({ _id: member._id, memberDealerVerified: e.target.checked })}
											/>
										</TableCell>
										<TableCell align="center">
											<Button
												onClick={(e: any) => menuIconClickHandler(e, member._id)}
												className={`badge ${member.memberStatus === 'ACTIVE' ? 'success' : member.memberStatus === 'BLOCK' ? 'warning' : 'error'}`}
											>
												{t(`status_${member.memberStatus}`)}
											</Button>
											{member.memberStatus === 'BLOCK' && member.memberBlockReason && (
												<Typography variant="caption" display="block" color="text.secondary" sx={{ maxWidth: 180, mx: 'auto' }}>
													{member.memberBlockReason}
												</Typography>
											)}

											<Menu
												className={'menu-modal'}
												MenuListProps={{
													'aria-labelledby': 'fade-button',
												}}
												anchorEl={anchorEl[member._id]}
												open={Boolean(anchorEl[member._id])}
												onClose={menuIconCloseHandler}
												TransitionComponent={Fade}
												sx={{ p: 1 }}
											>
												{Object.values(MemberStatus)
													.filter((ele: string) => ele !== member?.memberStatus)
													.map((status: string) => (
														<MenuItem
															onClick={() => updateMemberHandler({ _id: member._id, memberStatus: status })}
															key={status}
														>
															<Typography variant={'subtitle1'} component={'span'}>
																{t(`status_${status}`)}
															</Typography>
														</MenuItem>
													))}
											</Menu>
										</TableCell>
										<TableCell align="center">
											<Button size="small" variant="outlined" onClick={() => resetPasswordHandler(member._id, member.memberNick)}>
												{t('Reset password')}
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};
