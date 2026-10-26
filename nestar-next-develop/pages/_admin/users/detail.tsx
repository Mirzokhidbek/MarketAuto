import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Alert, Avatar, Box, Button, Chip, MenuItem, Select, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import ReasonDialog from '../../../libs/components/admin/ReasonDialog';
import { GET_CONVERSATIONS_BY_ADMIN, GET_MEMBER_ADMIN_DETAIL, GET_MESSAGES_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { AdminRole, MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';
import { imageUrl } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

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

	const { data, refetch } = useQuery(GET_MEMBER_ADMIN_DETAIL, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { memberId },
	});
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);
	// chats are private: loaded only after the admin confirms, and every look is written to the action log
	const [loadChats, { data: chatsData, called: chatsOpened }] = useLazyQuery(GET_CONVERSATIONS_BY_ADMIN, { fetchPolicy: 'network-only' });
	const [loadMessages, { data: messagesData, loading: messagesLoading }] = useLazyQuery(GET_MESSAGES_BY_ADMIN, {
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
			<Box component={'div'} className={'content'}>
				<Typography>{t('Loading...')}</Typography>
			</Box>
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
		<Box component={'div'} className={'content ma-admin-member'}>
			<Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/_admin/users')} sx={{ mb: 2 }}>
				{t('Member List')}
			</Button>

			<Box className={'ma-admin-card'}>
				<Stack direction={{ xs: 'column', md: 'row' }} gap={3} alignItems={{ md: 'center' }}>
					<Avatar src={avatar(member.memberImage)} alt={member.memberNick} sx={{ width: 72, height: 72 }} />
					<Box sx={{ flex: 1 }}>
						<Stack direction={'row'} gap={1} alignItems={'center'} flexWrap={'wrap'}>
							<Typography variant={'h5'} component={'h1'} fontWeight={700}>
								{member.memberFullName || member.memberNick}
							</Typography>
							<Chip size="small" label={t(`member_${member.memberType}`)} />
							<Chip
								size="small"
								color={member.memberStatus === 'ACTIVE' ? 'success' : 'error'}
								label={t(`status_${member.memberStatus}`)}
							/>
							{member.memberTrusted && <Chip size="small" color="primary" variant="outlined" label={t('Trusted')} />}
							{member.memberDealerVerified && <Chip size="small" color="primary" variant="outlined" label={t('Verified dealer')} />}
						</Stack>
						<Typography color="text.secondary" sx={{ mt: 0.5 }}>
							@{member.memberNick} · +{member.memberPhone} {member.memberPhoneVerified ? '✓' : ''} · {t('Joined')}{' '}
							{moment(member.createdAt).format('DD.MM.YYYY')}
						</Typography>
						{blocked && member.memberBlockReason && (
							<Alert severity="error" sx={{ mt: 1.5 }}>
								{t('Block reason')}: {member.memberBlockReason}
							</Alert>
						)}
					</Box>
					<Stack direction={'row'} gap={1} flexWrap={'wrap'}>
						<Link href={`/member?memberId=${memberId}`} target={'_blank'}>
							<Button variant="outlined">{t('Public profile')}</Button>
						</Link>
						{member.memberType !== MemberType.ADMIN &&
							(blocked ? (
								<Button variant="contained" color="success" onClick={() => update({ memberStatus: MemberStatus.ACTIVE })}>
									{t('Unblock')}
								</Button>
							) : (
								<Button variant="contained" color="error" onClick={() => setBlockOpen(true)}>
									{t('Block')}
								</Button>
							))}
					</Stack>
				</Stack>

				{member.memberType === MemberType.ADMIN && (
					<Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 3 }}>
						<Typography fontWeight={600}>{t('Admin role')}</Typography>
						<Select
							size="small"
							value={member.memberAdminRole ?? AdminRole.MODERATOR}
							onChange={(e) =>
								update(
									{ memberAdminRole: e.target.value },
									e.target.value === AdminRole.SUPER ? (t('Give full admin rights?') as string) : undefined,
								)
							}
						>
							{Object.values(AdminRole).map((role) => (
								<MenuItem key={role} value={role}>
									{t(`role_${role}`)}
								</MenuItem>
							))}
						</Select>
						<Typography variant="body2" color="text.secondary">
							{t('Moderators review cars, reports, articles and support; members, logs and settings are for full admins.')}
						</Typography>
					</Stack>
				)}
			</Box>

			<div className={'ma-admin-stats'} style={{ marginTop: 20 }}>
				{counts.map(([label, value, href]) => (
					<div
						key={label}
						className={`ma-admin-stat ${label === 'Reports against' && value > 0 ? 'is-warn' : ''}`}
						style={{ cursor: href ? 'pointer' : 'default' }}
						onClick={() => href && router.push(href)}
					>
						<span>{t(label)}</span>
						<strong>{value}</strong>
					</div>
				))}
			</div>

			<Box className={'ma-admin-card'} sx={{ mt: 3 }}>
				<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} sx={{ mb: 2 }}>
					<Typography variant={'h6'} fontWeight={700}>
						{t('Messages')}
					</Typography>
					{!chatsOpened && (
						<Button variant="outlined" onClick={openChatsHandler} disabled={!detail!.conversations}>
							{t('View chats')}
						</Button>
					)}
				</Stack>
				{!chatsOpened ? (
					<Typography color="text.secondary">
						{t('Use only when checking a report: opening the chats is written to the action log.')}
					</Typography>
				) : (
					<div className={'ma-admin-chats'}>
						<div className={'ma-admin-chats__list'}>
							{!chats.length && <Typography color="text.secondary">{t('No messages yet.')}</Typography>}
							{chats.map((chat) => (
								<button
									key={chat._id}
									className={chat._id === chatId ? 'is-active' : ''}
									onClick={() => openChatHandler(chat._id)}
								>
									<img src={avatar(chat.otherMember?.memberImage)} alt={''} />
									<span>
										<strong>{chat.otherMember?.memberNick ?? t('Deleted member')}</strong>
										{chat.propertyData && <em>{chat.propertyData.propertyTitle}</em>}
										<small>{moment(chat.lastMessageAt).format('DD.MM.YYYY HH:mm')}</small>
									</span>
								</button>
							))}
						</div>
						<div className={'ma-admin-chats__thread'}>
							{!chatId && <Typography color="text.secondary">{t('Choose a conversation')}</Typography>}
							{chatId && messagesLoading && <Typography color="text.secondary">{t('Loading...')}</Typography>}
							{chatId &&
								messages.map((message) => {
									const mine = String(message.senderId) === String(memberId);
									return (
										<div key={message._id} className={`ma-bubble ${mine ? 'is-mine' : ''}`}>
											{message.image && (
												<a href={imageUrl(message.image)} target={'_blank'} rel={'noopener noreferrer'}>
													<img className={'ma-bubble__image'} src={imageUrl(message.image)} alt={t('Photo') as string} />
												</a>
											)}
											{message.text && <p>{message.text}</p>}
											<small>{moment(message.createdAt).format('DD.MM HH:mm')}</small>
										</div>
									);
								})}
						</div>
					</div>
				)}
			</Box>

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
		</Box>
	);
};

export default withAdminLayout(AdminMemberDetail);
