import { uploadImage } from '../../upload';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { GET_CONVERSATIONS, GET_MEMBER, GET_MESSAGES, GET_PROPERTY } from '../../../apollo/user/query';
import { SEND_MESSAGE } from '../../../apollo/user/mutation';
import { incomingMessageVar, unreadMessagesVar, userVar } from '../../../apollo/store';
import { sweetErrorHandling } from '../../sweetAlert';
import { imageUrl } from '../../utils';
import { usePrice } from '../../hooks/usePrice';
import EmptyState from '../ui/EmptyState';
import { T } from '../../types/common';
import { AttachFileIcon, SendIcon, ArrowBackIcon } from '../ui/icons';
import { accountPanel, accountPanelHead, iconButton } from '../ui/styles';
import { cx } from '../ui/classNames';
import { buttonClasses } from '../ui/Button';

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
	const [attaching, setAttaching] = useState<boolean>(false);
	const [messages, setMessages] = useState<T[]>([]);
	const bottomRef = useRef<HTMLDivElement>(null);

	/** APOLLO REQUESTS **/
	const {
		data: conversationsData,
		loading: conversationsLoading,
		refetch: refetchConversations,
	} = useQuery<any>(GET_CONVERSATIONS, {
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

	const { data: completedData1, refetch: refetchMessages } = useQuery<any>(GET_MESSAGES, {
		fetchPolicy: 'network-only',
		skip: !activeId,
		variables: { input: { conversationId: activeId, page: 1, limit: 100 } },
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!completedData1) return;
		const data: any = completedData1;
		setMessages([...(data?.getMessages?.list ?? [])].reverse());
		refetchConversations().then(({ data: fresh }) => {
			const unread = (fresh?.getConversations?.list ?? []).reduce(
				(sum: number, item: T) => sum + (item.unreadCount ?? 0),
				0,
			);
			unreadMessagesVar(unread);
		});
	}, [completedData1]);
	// header data for a brand-new dialog
	const { data: newMemberData } = useQuery<any>(GET_MEMBER, { skip: !toId || !!existing, variables: { input: toId } });
	const { data: newPropertyData } = useQuery<any>(GET_PROPERTY, {
		skip: !propertyId || !!existing,
		variables: { input: propertyId },
	});
	const [sendMessage, { loading: sending }] = useMutation<any>(SEND_MESSAGE);

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
			setMessages((prev) =>
				prev.some((item) => item._id === incoming.message._id) ? prev : [...prev, incoming.message],
			);
			if (String(incoming.message.senderId) !== String(user._id)) refetchMessages().then(); // marks it read
		} else {
			refetchConversations().then();
		}
	}, [incoming]);

	/** HANDLERS **/
	const open = (id: string) =>
		router.push({ pathname: '/mypage', query: { category: 'messages', c: id } }, undefined, { shallow: true });

	const sendHandler = async (e?: React.FormEvent, image?: string) => {
		e?.preventDefault();
		const body = text.trim();
		if ((!body && !image) || !other?._id) return;
		try {
			const { data } = await sendMessage({
				variables: {
					input: {
						receiverId: other._id,
						propertyId: existing?.propertyId ?? (propertyId || undefined),
						text: image ? undefined : body,
						image,
					},
				},
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

	/** photo of a document or a scratch: uploaded first, then sent as its own message */
	const attachHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		setAttaching(true);
		try {
			const image = await uploadImage(file, 'message');
			await sendHandler(undefined, image);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setAttaching(false);
		}
	};

	return (
		<div className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{t('Messages')}</h1>
					<p>{t('Private conversations with buyers and sellers.')}</p>
				</div>
			</div>

			<div className="grid h-[70vh] grid-cols-1 overflow-hidden rounded-[14px] border border-line bg-white font-sans md:h-[620px] md:grid-cols-[320px_minmax(0,1fr)]">
				<aside className={cx('overflow-y-auto border-line md:block md:border-r', threadOpen && 'max-md:hidden')}>
					{!conversations.length ? (
						<EmptyState
							className={'m-4'}
							loading={conversationsLoading}
							text={t('No messages yet. Open a car and press "Write to seller".')}
							actionLabel={t('Browse cars')}
							actionHref={'/property'}
						/>
					) : (
						conversations.map((item) => (
							<button
								key={item._id}
								className={cx(
									'flex w-full cursor-pointer gap-2.5 border-0 border-b border-line px-4 py-3.5 text-left font-sans hover:bg-[#eff6ff]',
									item._id === activeId ? 'bg-[#eff6ff]' : 'bg-white',
								)}
								onClick={() => open(item._id)}
							>
								<img src={avatar(item.otherMember?.memberImage)} alt={''} className="size-10 shrink-0 rounded-full object-cover" />
								<div className="flex min-w-0 flex-1 flex-col">
									<strong className="text-sm text-ink">
										{item.otherMember?.memberFullName || item.otherMember?.memberNick || t('Deleted member')}
									</strong>
									{item.propertyData && <em className="text-xs text-primary not-italic">{item.propertyData.propertyTitle}</em>}
									<span className="overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-muted">{item.lastMessage}</span>
								</div>
								<div className="flex flex-col items-end gap-1.5">
									<small className="text-[11px] whitespace-nowrap text-muted">{moment(item.lastMessageAt).fromNow()}</small>
									{item.unreadCount > 0 && (
										<b className="min-w-5 rounded-full bg-primary px-1.5 py-px text-center text-[11px] text-white">{item.unreadCount}</b>
									)}
								</div>
							</button>
						))
					)}
				</aside>

				<section className={cx('min-h-0 flex-col md:flex', threadOpen ? 'flex' : 'max-md:hidden')}>
					{threadOpen && other ? (
						<>
							<header className="flex items-center gap-3 border-b border-line px-[18px] py-3">
								<button
									className={cx(iconButton, 'w-10 justify-center px-0 md:hidden')}
									onClick={() => router.push('/mypage?category=messages')}
								>
									<ArrowBackIcon />
								</button>
								<img src={avatar(other.memberImage)} alt={''} className="size-10 rounded-full object-cover" />
								<div className="flex flex-col">
									<Link href={`/member?memberId=${other._id}`}>
										<strong className="text-ink">{other.memberFullName || other.memberNick}</strong>
									</Link>
									{car && (
										<Link href={`/property/detail?id=${car._id}`}>
											<span className="text-[13px] text-primary">
												{car.propertyTitle} · {price(car)}
											</span>
										</Link>
									)}
								</div>
							</header>
							<div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#f1f3f6] p-[18px]">
								{!messages.length && <p className="m-auto text-sm text-muted">{t('Say hello and ask about the car.')}</p>}
								{messages.map((message) => {
									const mine = String(message.senderId) === String(user._id);
									return (
										<div
											key={message._id}
											className={cx(
												'max-w-[75%] px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
												mine
													? 'self-end rounded-[16px_16px_4px_16px] bg-primary text-white'
													: 'self-start rounded-[16px_16px_16px_4px] bg-white text-ink',
											)}
										>
											{message.image && (
												<a href={imageUrl(message.image)} target={'_blank'} rel={'noopener noreferrer'}>
													<img
														className="mb-1 block max-h-60 max-w-60 rounded-[10px] object-cover"
														src={imageUrl(message.image)}
														alt={t('Photo') as string}
													/>
												</a>
											)}
											{message.text && <p className="m-0 text-sm leading-[1.45] break-words whitespace-pre-wrap">{message.text}</p>}
											<small className={cx('mt-1 block text-right text-[11px]', mine ? 'text-white' : 'text-muted')}>
												{moment(message.createdAt).format('HH:mm')}
												{mine && message.readAt ? ' ✓✓' : mine ? ' ✓' : ''}
											</small>
										</div>
									);
								})}
								<div ref={bottomRef} />
							</div>
							<form className="flex gap-2.5 border-t border-line px-3.5 py-3" onSubmit={(e) => sendHandler(e)}>
								<label
									className={cx(iconButton, 'w-10 justify-center self-center px-0', attaching && 'cursor-progress opacity-40')}
									aria-label={t('Send a photo') as string}
								>
									<AttachFileIcon />
									<input
										type="file"
										hidden
										accept="image/jpeg, image/png, image/webp"
										onChange={attachHandler}
										disabled={attaching}
									/>
								</label>
								<textarea
									className="max-h-[120px] min-h-11 flex-1 resize-none rounded-xl border border-line px-3.5 py-[11px] font-sans text-sm outline-none focus:border-primary"
									maxLength={1000}
									rows={1}
									placeholder={t('Type a message') as string}
									value={text}
									onChange={(e) => setText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) sendHandler(e as any);
									}}
								/>
								<button
									className={buttonClasses()}
									disabled={!text.trim() || sending}
									aria-label={t('Send') as string}
								>
									<SendIcon />
								</button>
							</form>
						</>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-muted">{t('Choose a conversation')}</div>
					)}
				</section>
			</div>
		</div>
	);
};

export default Messages;
