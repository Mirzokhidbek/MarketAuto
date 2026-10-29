import React from 'react';
import { cx } from './classNames';

interface TabItem<T extends string> {
	value: T;
	label: React.ReactNode;
}

interface UnderlineTabsProps<T extends string> {
	items: TabItem<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
}

/** a row of filters (not a row of buttons); scrolls sideways on narrow screens */
const UnderlineTabs = <T extends string>({ items, value, onChange, className }: UnderlineTabsProps<T>) => (
	<div
		role={'tablist'}
		className={cx(
			'mb-5 flex gap-6 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
			className,
		)}
	>
		{items.map((item) => {
			const active = item.value === value;
			return (
				<button
					key={item.value}
					type={'button'}
					role={'tab'}
					aria-selected={active}
					onClick={() => onChange(item.value)}
					className={cx(
						'-mb-px h-[42px] shrink-0 cursor-pointer border-0 border-b-2 bg-transparent font-sans text-sm font-semibold transition-colors',
						'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
						active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
					)}
				>
					{item.label}
				</button>
			);
		})}
	</div>
);

export default UnderlineTabs;
