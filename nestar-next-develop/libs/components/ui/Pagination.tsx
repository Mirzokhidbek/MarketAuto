import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { cx } from './classNames';

interface PaginationProps {
	page: number;
	total: number;
	pageSize: number;
	onChange: (page: number) => void;
	className?: string;
}

/** 1 … 4 5 6 … 20: the first, the last and two pages around the current one */
const pagesAround = (page: number, count: number): (number | '…')[] => {
	const pages = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
	const sorted = [...pages].sort((a, b) => a - b);
	return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['…', p] as const) : ([p] as const)));
};

const item =
	'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent px-2 font-sans text-sm text-text tabular-nums hover:bg-surface disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent';

/** page numbers under a list; hidden when everything fits on one page */
const Pagination = ({ page, total, pageSize, onChange, className }: PaginationProps) => {
	const { t } = useTranslation('common');
	const count = Math.ceil(total / pageSize);
	if (count <= 1) return null;

	return (
		<nav className={cx('mt-9 flex items-center justify-center gap-1', className)} aria-label={t('Pages') as string}>
			<button className={item} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('Previous page') as string}>
				<ChevronLeftIcon fontSize="small" />
			</button>
			{pagesAround(page, count).map((p, i) =>
				p === '…' ? (
					<span key={`gap${i}`} className="px-1 text-faint">
						…
					</span>
				) : (
					<button
						key={p}
						className={cx(item, p === page && 'bg-ink! text-white!')}
						aria-current={p === page ? 'page' : undefined}
						onClick={() => onChange(p)}
					>
						{p}
					</button>
				),
			)}
			<button className={item} disabled={page >= count} onClick={() => onChange(page + 1)} aria-label={t('Next page') as string}>
				<ChevronRightIcon fontSize="small" />
			</button>
		</nav>
	);
};

export default Pagination;
