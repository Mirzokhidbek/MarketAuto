import React from 'react';
import { cx } from './classNames';

/** red counter on an icon (unread messages, notifications); hidden at 0, "99+" above 99 */
export const CountBadge = ({ count, children, className }: { count?: number; children: React.ReactNode; className?: string }) => (
	<span className={cx('relative inline-flex', className)}>
		{children}
		{!!count && count > 0 && (
			<span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 font-sans text-[11px] leading-none font-semibold text-white ring-2 ring-white">
				{count > 99 ? '99+' : count}
			</span>
		)}
	</span>
);

/** loading circle */
export const Spinner = ({ size = 24, className }: { size?: number; className?: string }) => (
	<span
		role={'progressbar'}
		aria-busy={true}
		className={cx('inline-block animate-spin rounded-full border-[3px] border-line border-t-primary', className)}
		style={{ width: size, height: size }}
	/>
);

/** grey placeholder block while content loads */
export const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
	<span className={cx('block animate-pulse rounded-md bg-surface-alt', className)} style={style} />
);
