import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useQuery, useReactiveVar } from '@apollo/client/react';
import { GET_EXCHANGE_RATE, GET_UNREAD_MESSAGES_COUNT } from '../../../apollo/user/query';
import { compareVar, Currency, currencyVar, unreadMessagesVar, usdRateVar, userVar } from '../../../apollo/store';
import { connectSocket, disconnectSocket } from '../../socket';
import { CountBadge } from '../ui/Feedback';
import { cx } from '../ui/classNames';
import { ChatIcon } from '../ui/icons';

/** app-wide state that every page needs: rate, chosen currency, compare list, live messages */
export const useGlobalSync = () => {
	const user = useReactiveVar(userVar);
	const { data: rateData } = useQuery<any>(GET_EXCHANGE_RATE, { fetchPolicy: 'cache-first' });
	const { data: unreadData } = useQuery<any>(GET_UNREAD_MESSAGES_COUNT, {
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
		} catch {
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

/** header icon with the number of unread messages */
export const MessagesLink = () => {
	const { t } = useTranslation('common');
	const unread = useReactiveVar(unreadMessagesVar);
	return (
		<Link
			href={'/mypage?category=messages'}
			className="inline-flex size-9 items-center justify-center rounded-full text-text hover:bg-surface-alt sm:size-10"
			aria-label={t('Messages') as string}
			title={t('Messages') as string}
		>
			<CountBadge count={unread}>
				<ChatIcon />
			</CountBadge>
		</Link>
	);
};

/** prices in dollars or so'm, remembered on this device */
export const CurrencySwitch = ({ className }: { className?: string }) => {
	const { t } = useTranslation('common');
	const currency = useReactiveVar(currencyVar);
	const choose = (value: Currency) => {
		currencyVar(value);
		localStorage.setItem('currency', value);
	};
	return (
		<div
			className={cx('inline-flex rounded-full bg-surface-alt p-[3px]', className)}
			role={'group'}
			aria-label={t('Show prices in') as string}
			title={t('Show prices in') as string}
		>
			{(['USD', 'UZS'] as Currency[]).map((value) => (
				<button
					key={value}
					type="button"
					className={cx(
						'cursor-pointer rounded-full border-0 px-2.5 py-1 font-sans text-xs font-semibold',
						currency === value ? 'bg-white text-primary shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted',
					)}
					aria-pressed={currency === value}
					onClick={() => choose(value)}
				>
					{value === 'USD' ? '$' : t("so'm")}
				</button>
			))}
		</div>
	);
};
