import React from 'react';
import { cx } from './classNames';

interface ListHeaderProps {
	/** "24 sellers found", a short intro line */
	summary: React.ReactNode;
	/** search, sort, the main action */
	actions?: React.ReactNode;
	className?: string;
}

/** the row above a list; actions go under the summary on tablets and phones */
const ListHeader = ({ summary, actions, className }: ListHeaderProps) => (
	<div
		className={cx(
			'mb-5 flex flex-col items-start gap-4 border-b border-line pb-4 font-sans md:flex-row md:items-end md:justify-between',
			className,
		)}
	>
		<p className={'text-sm text-muted'}>{summary}</p>
		{actions && <div className={'flex w-full flex-wrap items-center gap-3 md:w-auto md:flex-nowrap'}>{actions}</div>}
	</div>
);

export default ListHeader;
