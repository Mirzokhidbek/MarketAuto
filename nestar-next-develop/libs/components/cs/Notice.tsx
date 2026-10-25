import React from 'react';
import { Stack, Box } from '@mui/material';
import { useTranslation } from 'next-i18next';

const Notice = () => {
	const { t } = useTranslation('common');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	/** HANDLERS **/

	const data = [
		{
			no: 1,
			event: true,
			title: 'Register to use and get discounts',
			date: '01.03.2024',
		},
		{
			no: 2,
			title: "It's absolutely free to list and sell your car",
			date: '31.03.2024',
		},
	];

	return (
		<div className={'ma-notice-list'}>
			{data.map((item: any) => (
				<div className={'ma-notice'} key={item.no}>
					<span className={'ma-notice__no'}>{item.no}</span>
					<strong>{t(item.title)}</strong>
					<span className={'ma-notice__date'}>{item.date}</span>
				</div>
			))}
		</div>
	);
};

export default Notice;
