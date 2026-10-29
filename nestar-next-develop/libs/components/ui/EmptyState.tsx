import React from 'react';
import { useTranslation } from 'next-i18next';
import { Skeleton } from '@mui/material';
import { ButtonLink } from './Button';
import { cx } from './classNames';

interface EmptyStateProps {
	text: string;
	loading?: boolean;
	actionLabel?: string;
	actionHref?: string;
	className?: string;
}

/** "nothing here yet" with a next step; skeleton rows while loading */
const EmptyState = ({ text, loading, actionLabel, actionHref, className }: EmptyStateProps) => {
	const { t } = useTranslation('common');
	if (loading)
		return (
			<div className={cx('flex flex-col gap-3', className)} aria-label={t('Loading...') as string} aria-busy={true}>
				{[0, 1, 2].map((item) => (
					<Skeleton key={item} variant="rounded" height={86} animation="wave" />
				))}
			</div>
		);
	return (
		<div
			className={cx(
				'flex flex-col items-center gap-3.5 border-y border-line px-6 py-14 text-center font-sans text-[15px] text-muted',
				className,
			)}
		>
			<p>{text}</p>
			{actionLabel && actionHref && <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>}
		</div>
	);
};

export default EmptyState;
