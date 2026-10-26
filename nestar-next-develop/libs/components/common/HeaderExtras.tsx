import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Badge } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { GET_EXCHANGE_RATE, GET_UNREAD_MESSAGES_COUNT } from '../../../apollo/user/query';
import { compareVar, Currency, currencyVar, unreadMessagesVar, usdRateVar, userVar } from '../../../apollo/store';
import { connectSocket, disconnectSocket } from '../../socket';

/** app-wide state that every page needs: rate, chosen currency, compare list, live messages */
export const useGlobalSync = () => {
	const user = useReactiveVar(userVar);
	const { data: rateData } = useQuery(GET_EXCHANGE_RATE, { fetchPolicy: 'cache-first' });
	const { data: unreadData } = useQuery(GET_UNREAD_MESSAGES_COUNT, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
		pollInterval: 120000,
	});

	useEffect(() => {
		const saved = localStorage.getItem('currency');
		if (saved === 'USD' || saved === 'UZS') currencyVar(saved);
		try {
			const ids = JSON.parse(localStorage.getItem('compare') ?? '[]');
			if (Array.isArray(ids)) compareVar(ids.slice(0, 3));
		} catch (err) {
			// broken value: start with an empty list
		}
	}, []);

	useEffect(() => {
		if (rateData?.getExchangeRate?.usdToUzs) usdRateVar(rateData.getExchangeRate.usdToUzs);
	}, [rateData]);

	useEffect(() => {
		if (typeof unreadData?.getUnreadMessagesCount === 'number') unreadMessagesVar(unreadData.getUnreadMessagesCount);
	}, [unreadData]);

	// live private messages only while logged in
	useEffect(() => {
		if (user?._id) connectSocket();
		else disconnectSocket();
	}, [user?._id]);
};

export const MessagesLink = () => {
	const { t } = useTranslation('common');
	const unread = useReactiveVar(unreadMessagesVar);
	return (
		<Link href={'/mypage?category=messages'} className={'ma-bell'} aria-label={t('Messages') as string}>
			<Badge badgeContent={unread} color="error" max={99}>
				<ChatBubbleOutlineIcon className={'notification-icon'} />
			</Badge>
		</Link>
	);
};

export const CurrencySwitch = () => {
	const { t } = useTranslation('common');
	const currency = useReactiveVar(currencyVar);
	const choose = (value: Currency) => {
		currencyVar(value);
		localStorage.setItem('currency', value);
	};
	return (
		<div className={'ma-currency'} role={'group'} aria-label={t('Currency') as string}>
			{(['USD', 'UZS'] as Currency[]).map((value) => (
				<button
					key={value}
					className={currency === value ? 'is-active' : ''}
					aria-pressed={currency === value}
					onClick={() => choose(value)}
				>
					{value === 'USD' ? '$' : "so'm"}
				</button>
			))}
		</div>
	);
};
