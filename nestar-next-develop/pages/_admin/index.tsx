import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { Box, Typography } from '@mui/material';
import withAdminLayout from '../../libs/components/layout/LayoutAdmin';
import { GET_DASHBOARD_STATS } from '../../apollo/admin/query';
import { T } from '../../libs/types/common';

const cards = [
	{ key: 'membersTotal', label: 'Members', hint: 'registered (excluding admins)', href: '/_admin/users' },
	{ key: 'membersToday', label: 'New members today', hint: 'signed up since 00:00', href: '/_admin/users' },
	{ key: 'dealers', label: 'Dealers', hint: 'active dealer accounts', href: '/_admin/users' },
	{ key: 'membersBlocked', label: 'Blocked members', hint: 'cannot log in or post', href: '/_admin/users', warn: true },
	{ key: 'carsActive', label: 'Cars for sale', hint: 'active listings', href: '/_admin/properties' },
	{ key: 'carsToday', label: 'New cars today', hint: 'listed since 00:00', href: '/_admin/properties' },
	{ key: 'carsSold', label: 'Sold cars', hint: 'marked as sold', href: '/_admin/properties' },
	{ key: 'carsDeleted', label: 'Deleted cars', hint: 'can be restored or removed', href: '/_admin/properties' },
	{ key: 'articlesActive', label: 'Articles', hint: 'published in community', href: '/_admin/community' },
	{ key: 'inquiriesWaiting', label: 'Open inquiries', hint: 'waiting for an answer', href: '/_admin/cs/inquiry', warn: true },
];

const AdminHome: NextPage = () => {
	const { data, loading } = useQuery(GET_DASHBOARD_STATS, { fetchPolicy: 'network-only', pollInterval: 60000 });
	const stats: T = data?.getDashboardStats ?? {};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Dashboard
			</Typography>
			<div className={'ma-admin-stats'}>
				{cards.map((card) => (
					<Link href={card.href} key={card.key}>
						<div className={`ma-admin-stat ${card.warn && stats[card.key] > 0 ? 'is-warn' : ''}`}>
							<span>{card.label}</span>
							<strong>{loading && stats[card.key] === undefined ? '…' : stats[card.key] ?? 0}</strong>
							<em>{card.hint}</em>
						</div>
					</Link>
				))}
			</div>
		</Box>
	);
};

export default withAdminLayout(AdminHome);
