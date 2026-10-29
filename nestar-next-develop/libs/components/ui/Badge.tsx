import React from 'react';
import { cx } from './classNames';

type BadgeTone = 'primary' | 'light';

const tones: Record<BadgeTone, string> = {
	primary: 'bg-primary-soft text-primary-dark',
	light: 'bg-white text-text shadow-[0_0_0_1px_rgba(15,23,42,0.08)]',
};

interface BadgeProps {
	tone?: BadgeTone;
	className?: string;
	children: React.ReactNode;
}

/** small label: seller type, article category */
const Badge = ({ tone = 'primary', className, children }: BadgeProps) => (
	<span className={cx('inline-flex h-[22px] items-center rounded px-[7px] font-sans text-xs font-semibold', tones[tone], className)}>
		{children}
	</span>
);

export default Badge;
