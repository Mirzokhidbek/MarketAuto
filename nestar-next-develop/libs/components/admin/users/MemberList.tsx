import { useTranslation } from 'next-i18next/pages';
import { imageUrl } from '../../../utils';
import React from 'react';
import Link from 'next/link';
import { Member } from '../../../types/member/member';
import { MemberUpdate } from '../../../types/member/member.update';
import { MemberStatus, MemberType } from '../../../enums/member.enum';
import { LockResetIcon as LockResetRoundedIcon } from '../../ui/icons';
import { cx } from '../../ui/classNames';
import { switchInput } from '../../ui/Switch';
import {
	adminButton,
	adminTable,
	caption,
	NoRows,
	PillTone,
	StatusMenu,
	TableScroll,
	td,
	tdActions,
	tdTitle,
	th,
	ThHint,
	tr,
} from '../ui';

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

interface HeadCell {
	/** shown as a tooltip with an (i) icon: what the switch in this column does */
	hint?: string;
	id: keyof Data;
	label: string;
	numeric: boolean;
}

const headCells: readonly HeadCell[] = [
	{
		id: 'nickname',
		numeric: true,
		label: 'NICKNAME',
	},
	{
		id: 'fullname',
		numeric: false,
		label: 'FULL NAME',
	},
	{
		id: 'phone',
		numeric: true,
		label: 'PHONE',
	},
	{
		id: 'type',
		numeric: false,
		label: 'MEMBER TYPE',
	},
	{
		id: 'warning',
		numeric: false,
		label: 'PHONE CONFIRMED',
		hint: 'The member confirmed this phone with an SMS code',
	},
	{
		id: 'block',
		numeric: false,
		label: 'TRUSTED',
		hint: 'Trusted sellers publish without moderation. Given automatically after the first approved car.',
	},
	{
		id: 'dealer',
		numeric: false,
		label: 'VERIFIED DEALER',
		hint: 'You checked the dealership documents. Buyers see a "Verified dealer" badge.',
	},
	{
		id: 'state',
		numeric: false,
		label: 'STATUS',
	},
	{
		id: 'actions',
		numeric: false,
		label: 'ACTIONS',
	},
];

const statusTone: Record<string, PillTone> = { ACTIVE: 'success', BLOCK: 'warning', DELETE: 'error' };

interface MemberPanelListType {
	members: Member[];
	resetPasswordHandler: (id: string, nick: string) => void;
	updateMemberHandler: (update: MemberUpdate) => void;
}

export const MemberPanelList = ({ members, updateMemberHandler, resetPasswordHandler }: MemberPanelListType) => {
	const { t } = useTranslation('common');

	return (
		<TableScroll>
			<table className={adminTable} aria-label={t('Members') as string}>
				<thead>
					<tr>
						{headCells.map((headCell) => (
							<th
								key={headCell.id}
								// short headers stay on one line; the long switch headers may wrap so the table still fits
								className={cx(
									th,
									!headCell.numeric && 'text-center',
									!['nickname', 'fullname', 'phone', 'state', 'actions'].includes(headCell.id) && 'whitespace-normal',
								)}
							>
								{headCell.hint ? <ThHint hint={t(headCell.hint) as string}>{t(headCell.label)}</ThHint> : t(headCell.label)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{members.length === 0 && <NoRows colSpan={10}>{t('No members found')}</NoRows>}

					{members.map((member: Member) => {
						const memberImage = member.memberImage ? imageUrl(member.memberImage) : '/img/profile/defaultUser.svg';
						return (
							<tr key={member?._id} className={tr}>
								<td className={cx(td, tdTitle)}>
									<Link href={`/_admin/users/detail?id=${member._id}`} className="flex items-center gap-2.5 text-[#0f172a]">
										<img alt={member.memberNick} src={memberImage} className="size-10 shrink-0 rounded-full object-cover" />
										<span>
											{member.memberNick}
											{member.memberType === 'ADMIN' && member.memberAdminRole && (
												<span className={caption}>{t(`role_${member.memberAdminRole}`)}</span>
											)}
										</span>
									</Link>
								</td>

								<td className={cx(td, 'text-center')} data-label={t('FULL NAME')}>
									{member.memberFullName || '—'}
								</td>
								<td className={cx(td, 'whitespace-nowrap')} data-label={t('PHONE')}>
									{member.memberPhone ? `+${member.memberPhone}` : '—'}
								</td>

								<td className={cx(td, 'text-center')} data-label={t('MEMBER TYPE')}>
									<StatusMenu
										value={member.memberType as string}
										label={t(`member_${member.memberType}`)}
										tone="success"
										options={Object.values(MemberType)
											.filter((type) => type !== member?.memberType)
											.map((type) => ({ value: type as string, label: t(`member_${type}`) }))}
										onSelect={(type) => updateMemberHandler({ _id: member._id, memberType: type as MemberType })}
									/>
								</td>

								<td className={cx(td, 'text-center')} data-label={t('PHONE CONFIRMED')}>
									{member.memberPhoneVerified ? '✓' : '—'}
								</td>
								{/* trusted sellers publish without moderation; admins do not sell, so no switch for them */}
								<td className={cx(td, 'text-center')} data-label={t('TRUSTED')}>
									{member.memberType === 'ADMIN' ? (
										'—'
									) : (
										<input
											type="checkbox"
											role="switch"
											aria-label={t('TRUSTED') as string}
											className={switchInput}
											checked={!!member.memberTrusted}
											onChange={(e) => updateMemberHandler({ _id: member._id, memberTrusted: e.target.checked })}
										/>
									)}
								</td>
								{/* documents of the dealership were checked by the admin: dealers only */}
								<td className={cx(td, 'text-center')} data-label={t('VERIFIED DEALER')}>
									{member.memberType === 'AGENT' ? (
										<input
											type="checkbox"
											role="switch"
											aria-label={t('VERIFIED DEALER') as string}
											className={switchInput}
											checked={!!member.memberDealerVerified}
											onChange={(e) => updateMemberHandler({ _id: member._id, memberDealerVerified: e.target.checked })}
										/>
									) : (
										'—'
									)}
								</td>
								<td className={cx(td, 'text-center')} data-label={t('STATUS')}>
									<StatusMenu
										value={member.memberStatus as string}
										label={t(`status_${member.memberStatus}`)}
										tone={statusTone[member.memberStatus] ?? 'neutral'}
										options={Object.values(MemberStatus)
											.filter((status) => status !== member?.memberStatus)
											.map((status) => ({ value: status as string, label: t(`status_${status}`) }))}
										onSelect={(status) => updateMemberHandler({ _id: member._id, memberStatus: status as MemberStatus })}
									/>
									{member.memberStatus === 'BLOCK' && member.memberBlockReason && (
										<span className={cx(caption, 'mx-auto max-w-[180px]')}>{member.memberBlockReason}</span>
									)}
								</td>
								<td className={cx(td, tdActions, 'text-center')}>
									{/* an icon on wide screens keeps the table within the page; the phone card shows the words too */}
									<button
										className={adminButton({ variant: 'outlined', size: 'sm', className: 'md:w-8 md:px-0' })}
										title={t('Reset password') as string}
										aria-label={t('Reset password') as string}
										onClick={() => resetPasswordHandler(member._id, member.memberNick)}
									>
										<LockResetRoundedIcon fontSize="small" />
										<span className="md:hidden">{t('Reset password')}</span>
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</TableScroll>
	);
};
