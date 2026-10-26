import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GET_CONVERSATIONS, GET_MEMBER, GET_MESSAGES, GET_PROPERTY } from '../../../apollo/user/query';
import { SEND_MESSAGE } from '../../../apollo/user/mutation';
import { incomingMessageVar, unreadMessagesVar, userVar } from '../../../apollo/store';
import { sweetErrorHandling } from '../../sweetAlert';
import { imageUrl } from '../../utils';
import { usePrice } from '../../hooks/usePrice';
import EmptyState from '../common/EmptyState';
import { T } from '../../types/common';

const avatar = (image?: string) => (image ? imageUrl(image) : '/img/profile/defaultUser.svg');

/**
 * Private buyer <-> seller messages.
 * ?c=<conversationId> opens a dialog; ?to=<memberId>&propertyId=<carId> starts one from a car page.
 */
const Messages = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { price } = usePrice();
	const user = useReactiveVar(userVar);
	const incoming = useReactiveVar(incomingMessageVar);
	const conversationId = (router.query.c as string) || '';
	const toId = (router.query.to as string) || '';
	const propertyId = (router.query.propertyId as string) || '';
	const [text, setText] = useState<string>('');
	const [messages, setMessages] = useState<T[]>([]);
	const bottomRef = useRef<HTMLDivElement>(null);

	/** APOLLO REQUESTS **/
	const {
		data: conversationsData,
		loading: conversationsLoading,
		refetch: refetchConversations,
	} = useQuery(GET_CONVERSATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 50 } },
	});
	const conversations: T[] = conversationsData?.getConversations?.list ?? [];

	// a dialog that already exists for "to + car" is opened instead of a new one
	const existing = useMemo(
		() =>
			toId
				? conversations.find((item) => item.otherMember?._id === toId && (item.propertyId ?? '') === propertyId)
				: conversations.find((item) => item._id === conversationId),
		[conversations, toId, propertyId, conversationId],
	);
	const activeId = existing?._id ?? (toId ? '' : conversationId);

	const { refetch: refetchMessages } = useQuery(GET_MESSAGES, {
		fetchPolicy: 'network-only',
		skip: !activeId,
		variables: { input: { conversationId: activeId, page: 1, limit: 100 } },
		onCompleted: (data: T) => {
			setMessages([...(data?.getMessages?.list ?? [])].reverse());
			refetchConversations().then(({ data: fresh }) => {
				const unread = (fresh?.getConversations?.list ?? []).reduce((sum: number, item: T) => sum + (item.unreadCount ?? 0), 0);
				unreadMessagesVar(unread);
			});
		},
	});
	// header data for a brand-new dialog
	const { data: newMemberData } = useQuery(GET_MEMBER, { skip: !toId || !!existing, variables: { input: toId } });
	const { data: newPropertyData } = useQuery(GET_PROPERTY, { skip: !propertyId || !!existing, variables: { input: propertyId } });
	const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

	const other = existing?.otherMember ?? newMemberData?.getMember;
	const car = existing?.propertyData ?? newPropertyData?.getProperty;
	const threadOpen = !!activeId || !!toId;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!activeId) setMessages([]);
	}, [activeId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: 'end' });
	}, [messages]);

	// live message from the socket
	useEffect(() => {
		if (!incoming) return;
		if (incoming.conversationId === activeId) {
			setMessages((prev) => (prev.some((item) => item._id === incoming.message._id) ? prev : [...prev, incoming.message]));
			if (String(incoming.message.senderId) !== String(user._id)) refetchMessages().then(); // marks it read
		} else {
			refetchConversations().then();
		}
	}, [incoming]);

	/** HANDLERS **/
	const open = (id: string) => router.push({ pathname: '/mypage', query: { category: 'messages', c: id } }, undefined, { shallow: true });

	const sendHandler = async (e?: React.FormEvent) => {
		e?.preventDefault();
		const body = text.trim();
		if (!body || !other?._id) return;
		try {
			const { data } = await sendMessage({
				variables: { input: { receiverId: other._id, propertyId: existing?.propertyId ?? (propertyId || undefined), text: body } },
			});
			setText('');
			const sent = data?.sendMessage;
			if (!activeId && sent?.conversationId) {
				await refetchConversations();
				await open(sent.conversationId);
			} else if (sent) {
				setMessages((prev) => (prev.some((item) => item._id === sent._id) ? prev : [...prev, sent]));
				refetchConversations().then();
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className={'ma-account-panel ma-messages'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Messages')}</h1>
					<p>{t('Private conversations with buyers and sellers.')}</p>
				</div>
			</div>

			<div className={`ma-messages__layout ${threadOpen ? 'is-thread' : ''}`}>
				<aside className={'ma-messages__list'}>
					{!conversations.length ? (
						<EmptyState
							loading={conversationsLoading}
							text={t('No messages yet. Open a car and press "Write to seller".')}
							actionLabel={t('Browse cars')}
							actionHref={'/property'}
						/>
					) : (
						conversations.map((item) => (
							<button
								key={item._id}
								className={`ma-messages__item ${item._id === activeId ? 'is-active' : ''}`}
								onClick={() => open(item._id)}
							>
								<img src={avatar(item.otherMember?.memberImage)} alt={''} />
								<div>
									<strong>{item.otherMember?.memberFullName || item.otherMember?.memberNick || t('Deleted member')}</strong>
									{item.propertyData && <em>{item.propertyData.propertyTitle}</em>}
									<span>{item.lastMessage}</span>
								</div>
								<div className={'ma-messages__meta'}>
									<small>{moment(item.lastMessageAt).fromNow()}</small>
									{item.unreadCount > 0 && <b>{item.unreadCount}</b>}
								</div>
							</button>
						))
					)}
				</aside>

				<section className={'ma-messages__thread'}>
					{threadOpen && other ? (
						<>
							<header className={'ma-messages__head'}>
								<button className={'ma-icon-btn ma-messages__back'} onClick={() => router.push('/mypage?category=messages')}>
									<ArrowBackIcon />
								</button>
								<img src={avatar(other.memberImage)} alt={''} />
								<div>
									<Link href={`/member?memberId=${other._id}`}>
										<strong>{other.memberFullName || other.memberNick}</strong>
									</Link>
									{car && (
										<Link href={`/property/detail?id=${car._id}`}>
											<span>
												{car.propertyTitle} · {price(car)}
											</span>
										</Link>
									)}
								</div>
							</header>
							<div className={'ma-messages__body'}>
								{!messages.length && <p className={'ma-messages__hint'}>{t('Say hello and ask about the car.')}</p>}
								{messages.map((message) => {
									const mine = String(message.senderId) === String(user._id);
									return (
										<div key={message._id} className={`ma-bubble ${mine ? 'is-mine' : ''}`}>
											<p>{message.text}</p>
											<small>
												{moment(message.createdAt).format('HH:mm')}
												{mine && message.readAt ? ' ✓✓' : mine ? ' ✓' : ''}
											</small>
										</div>
									);
								})}
								<div ref={bottomRef} />
							</div>
							<form className={'ma-messages__form'} onSubmit={sendHandler}>
								<textarea
									maxLength={1000}
									rows={1}
									placeholder={t('Type a message') as string}
									value={text}
									onChange={(e) => setText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) sendHandler(e as any);
									}}
								/>
								<button className={'ma-btn ma-btn--primary'} disabled={!text.trim() || sending} aria-label={t('Send') as string}>
									<SendIcon />
								</button>
							</form>
						</>
					) : (
						<div className={'ma-messages__placeholder'}>{t('Choose a conversation')}</div>
					)}
				</section>
			</div>
		</div>
	);
};

export default Messages;
