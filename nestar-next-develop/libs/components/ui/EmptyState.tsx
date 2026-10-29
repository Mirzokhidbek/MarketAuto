import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Skeleton } from '@mui/material';

interface EmptyStateProps {
	text: string;
	loading?: boolean;
	actionLabel?: string;
	actionHref?: string;
}

/** "nothing here yet" with a next step; skeleton rows while loading */
const EmptyState = ({ text, loading, actionLabel, actionHref }: EmptyStateProps) => {
	const { t } = useTranslation('common');
	if (loading)
		return (
			<div className={'ma-skeleton-list'} aria-label={t('Loading...') as string}>
				{[0, 1, 2].map((item) => (
					<Skeleton key={item} variant="rounded" height={86} animation="wave" />
				))}
			</div>
		);
	return (
		<div className={'ma-empty ma-empty--cta'}>
			<p>{text}</p>
			{actionLabel && actionHref && (
				<Link href={actionHref}>
					<span className={'ma-btn ma-btn--primary'}>{actionLabel}</span>
				</Link>
			)}
		</div>
	);
};

export default EmptyState;
