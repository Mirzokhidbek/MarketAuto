import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import ReasonDialog from '../../../libs/components/admin/ReasonDialog';
import { GET_CONVERSATIONS_BY_ADMIN, GET_MEMBER_ADMIN_DETAIL, GET_MESSAGES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { AdminRole, MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { imageUrl } from '../../../libs/utils';
import { T } from '../../../libs/types/common';
import { ArrowBackIcon } from '../../../libs/components/ui/icons';
import { cx } from '../../../libs/components/ui/classNames';
import { AdminCard, adminButton, adminSelect, pill } from '../../../libs/components/admin/ui';
import { formatDate } from '../../../libs/date';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const avatar = (image?: string) => (image ? imageUrl(image) : '/img/profile/defaultUser.svg');

/** everything about one member on one screen: counts, cars, block/unblock, admin role and (logged) chats */
const AdminMemberDetail: NextPage = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const memberId = (router.query.id as string) || '';
	const [blockOpen, setBlockOpen] = useState<boolean>(false);
	const [chatId, setChatId] = useState<string>('');

	const { data, refetch } = useQuery<any>(GET_MEMBER_ADMIN_DETAIL, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { memberId },
	});
	const [updateMemberByAdmin] = useMutation<any>(UPDATE_MEMBER_BY_ADMIN);
	// chats are private: loaded only after the admin confirms, and every look is written to the action log
	const [loadChats, { data: chatsData, called: chatsOpened }] = useLazyQuery<any>(GET_CONVERSATIONS_BY_ADMIN, { fetchPolicy: 'network-only' });
	const [loadMessages, { data: messagesData, loading: messagesLoading }] = useLazyQuery<any>(GET_MESSAGES_BY_ADMIN, {
		fetchPolicy: 'network-only',
	});

	const detail: T | undefined = data?.getMemberAdminDetail;
	const member: T | undefined = detail?.member;
	const chats: T[] = chatsData?.getConversationsByAdmin?.list ?? [];
	const messages: T[] = [...(messagesData?.getMessagesByAdmin?.list ?? [])].reverse();

	const update = async (input: T, confirm?: string) => {
		try {
			if (confirm && !(await sweetConfirmAlert(confirm))) return;
			await updateMemberByAdmin({ variables: { input: { _id: memberId, ...input } } });
			await refetch();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const openChatsHandler = async () => {
		if (!(await sweetConfirmAlert(t('Private chats: this view is written to the action log. Continue?') as string))) return;
		loadChats({ variables: { memberId, input: { page: 1, limit: 50 } } });
	};

	const openChatHandler = (id: string) => {
		setChatId(id);
		loadMessages({ variables: { input: { conversationId: id, page: 1, limit: 100 } } });
	};

	if (!member) {
		return (
			<div className="mx-auto w-full max-w-[1440px] py-6 text-faint">{t('Loading...')}</div>
		);
	}

	const carsLink = (status?: string) =>
		`/_admin/properties?memberId=${memberId}${status ? `&status=${status}` : ''}`;
	const counts: [string, number, string?][] = [
		['Active', detail!.carsActive, carsLink('ACTIVE')],
		['Under review', detail!.carsPending, carsLink('PENDING')],
		['Rejected', detail!.carsRejected, carsLink('REJECTED')],
		['Sold', detail!.carsSold, carsLink('SOLD')],
		['Deleted', detail!.carsDeleted, carsLink('DELETE')],
		['Reports against', detail!.reportsAgainst],
		['Reports sent', detail!.reportsMade],
		['Reviews', detail!.reviewsReceived],
		['Conversations', detail!.conversations],
		['Active sessions', detail!.activeSessions],
	];
	const blocked = member.memberStatus === MemberStatus.BLOCK;

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<button className={adminButton({ variant: 'text', color: 'primary', className: 'mt-2 mb-4' })} onClick={() => router.push('/_admin/users')}>
				<ArrowBackIcon /> {t('Member List')}
			</button>
			<AdminCard>
				<div className="flex flex-col gap-6 md:flex-row md:items-center">
					<img src={avatar(member.memberImage)} alt={member.memberNick} className="size-[72px] rounded-full object-cover" />
					<div className="flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="m-0 text-2xl font-bold text-[#0f172a]">{member.memberFullName || member.memberNick}</h1>
							<span className={pill('neutral')}>{t(`member_${member.memberType}`)}</span>
							<span className={pill(member.memberStatus === 'ACTIVE' ? 'success' : 'error')}>{t(`status_${member.memberStatus}`)}</span>
							{member.memberTrusted && <span className={pill('info')}>{t('Trusted')}</span>}
							{member.memberDealerVerified && <span className={pill('info')}>{t('Verified dealer')}</span>}
						</div>
						<p className="m-0 mt-1 text-muted">
							@{member.memberNick} · +{member.memberPhone} {member.memberPhoneVerified ? '✓' : ''} · {t('Joined')}{' '}
							{formatDate(member.createdAt, 'DD.MM.YYYY')}
						</p>
						{blocked && member.memberBlockReason && (
							<p className="m-0 mt-3 rounded-[10px] bg-[#fde8e7] px-4 py-3 text-sm text-[#a50e0e]">
								{t('Block reason')}: {member.memberBlockReason}
							</p>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						<Link href={`/member?memberId=${memberId}`} target={'_blank'} className={adminButton({ variant: 'outlined' })}>
							{t('Public profile')}
						</Link>
						{member.memberType !== MemberType.ADMIN &&
							(blocked ? (
								<button className={adminButton({ color: 'success' })} onClick={() => update({ memberStatus: MemberStatus.ACTIVE })}>
									{t('Unblock')}
								</button>
							) : (
								<button className={adminButton({ color: 'error' })} onClick={() => setBlockOpen(true)}>
									{t('Block')}
								</button>
							))}
					</div>
				</div>
				{member.memberType === MemberType.ADMIN && (
					<div className="mt-6 flex flex-wrap items-center gap-4">
						<strong className="font-semibold text-[#0f172a]">{t('Admin role')}</strong>
						<select
							className={cx(adminSelect, 'h-10')}
							value={member.memberAdminRole ?? AdminRole.MODERATOR}
							onChange={(e) =>
								update(
									{ memberAdminRole: e.target.value },
									e.target.value === AdminRole.SUPER ? (t('Give full admin rights?') as string) : undefined,
								)
							}
						>
							{Object.values(AdminRole).map((role) => (
								<option key={role} value={role}>
									{t(`role_${role}`)}
								</option>
							))}
						</select>
						<span className="text-sm text-muted">
							{t('Moderators review cars, reports, articles and support; members, logs and settings are for full admins.')}
						</span>
					</div>
				)}
			</AdminCard>
			<div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] md:gap-3.5">
				{counts.map(([label, value, href]) => (
					<div
						key={label}
						className={cx(
							'flex flex-col gap-1.5 rounded-[18px] bg-white px-5 py-[18px] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] transition-transform hover:-translate-y-0.5',
							href ? 'cursor-pointer' : 'cursor-default',
						)}
						onClick={() => href && router.push(href)}
					>
						<span className="text-xs font-semibold text-faint">{t(label)}</span>
						<strong className={cx('text-[26px] leading-[1.1]', label === 'Reports against' && value > 0 ? 'text-[#e5484d]' : 'text-[#0f172a]')}>
							{value}
						</strong>
					</div>
				))}
			</div>
			<AdminCard className="mt-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="m-0 text-lg font-bold text-[#0f172a]">{t('Messages')}</h2>
					{!chatsOpened && (
						<button className={adminButton({ variant: 'outlined' })} onClick={openChatsHandler} disabled={!detail!.conversations}>
							{t('View chats')}
						</button>
					)}
				</div>
				{!chatsOpened ? (
					<p className="m-0 text-muted">{t('Use only when checking a report: opening the chats is written to the action log.')}</p>
				) : (
					<div className="grid min-h-80 grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
						<div className="flex max-h-[460px] flex-col gap-1 overflow-y-auto">
							{!chats.length && <p className="m-0 text-muted">{t('No messages yet.')}</p>}
							{chats.map((chat) => (
								<button
									key={chat._id}
									className={cx(
										'flex cursor-pointer items-center gap-2.5 rounded-[14px] border-0 px-2.5 py-2 text-left font-sans hover:bg-[#f3f5fa]',
										chat._id === chatId ? 'bg-[#f3f5fa]' : 'bg-transparent',
									)}
									onClick={() => openChatHandler(chat._id)}
								>
									<img src={avatar(chat.otherMember?.memberImage)} alt={''} className="size-9 rounded-full object-cover" />
									<span className="flex min-w-0 flex-col [&_em]:text-xs [&_em]:text-faint [&_em]:not-italic [&_small]:text-xs [&_small]:text-faint">
										<strong className="text-[#0f172a]">{chat.otherMember?.memberNick ?? t('Deleted member')}</strong>
										{chat.propertyData && <em>{chat.propertyData.propertyTitle}</em>}
										<small>{formatDate(chat.lastMessageAt, 'DD.MM.YYYY HH:mm')}</small>
									</span>
								</button>
							))}
						</div>
						<div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto rounded-[18px] bg-[#f3f5fa] p-3.5">
							{!chatId && <p className="m-0 text-muted">{t('Choose a conversation')}</p>}
							{chatId && messagesLoading && <p className="m-0 text-muted">{t('Loading...')}</p>}
							{chatId &&
								messages.map((message) => {
									const mine = String(message.senderId) === String(memberId);
									return (
										<div
											key={message._id}
											className={cx(
												'max-w-[75%] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
												mine ? 'self-end rounded-[16px_16px_4px_16px] bg-primary text-white' : 'self-start rounded-[16px_16px_16px_4px] bg-white text-ink',
											)}
										>
											{message.image && (
												<a href={imageUrl(message.image)} target={'_blank'} rel={'noopener noreferrer'}>
													<img className="mb-1 block max-h-60 max-w-60 rounded-[10px] object-cover" src={imageUrl(message.image)} alt={t('Photo') as string} />
												</a>
											)}
											{message.text && <p className="m-0 text-sm leading-[1.45] break-words whitespace-pre-wrap">{message.text}</p>}
											<small className={cx('mt-1 block text-right text-[11px]', mine ? 'text-white' : 'text-muted')}>
												{formatDate(message.createdAt, 'DD.MM HH:mm')}
											</small>
										</div>
									);
								})}
						</div>
					</div>
				)}
			</AdminCard>
			<ReasonDialog
				open={blockOpen}
				title={`${t('Block')} ${member.memberNick}`}
				description={t('The member is logged out everywhere and sees this reason when trying to log in.') as string}
				presets={['Fraud or fake listings', 'Spam', 'Insulting other members', 'Selling forbidden goods']}
				confirmLabel={t('Block')}
				onConfirm={(reason) => {
					setBlockOpen(false);
					update({ memberStatus: MemberStatus.BLOCK, memberBlockReason: reason });
				}}
				onClose={() => setBlockOpen(false)}
			/>
		</div>
	);
};

export default withAdminLayout(AdminMemberDetail);
