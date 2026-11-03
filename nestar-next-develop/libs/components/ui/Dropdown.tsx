import React, { useEffect, useId, useRef, useState } from 'react';
import { cx } from './classNames';

interface DropdownProps {
	/** the button that opens the panel; gets the open state for its own look */
	trigger: (props: { open: boolean; toggle: () => void; id: string }) => React.ReactNode;
	children: (close: () => void) => React.ReactNode;
	align?: 'left' | 'right';
	className?: string;
	panelClassName?: string;
}

/**
 * A panel under a button (account menu, language, notifications). Closes on a click outside,
 * on Escape, and when an item calls close().
 */
const Dropdown = ({ trigger, children, align = 'right', className, panelClassName }: DropdownProps) => {
	const [open, setOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);
	const id = useId();

	useEffect(() => {
		if (!open) return;
		const onPointer = (e: PointerEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	return (
		<div ref={root} className={cx('relative', className)}>
			{trigger({ open, toggle: () => setOpen((value) => !value), id })}
			{open && (
				<div
					id={id}
					role={'menu'}
					className={cx(
						'absolute top-[calc(100%+8px)] z-[1300] min-w-[180px] overflow-hidden rounded-[12px] border border-line bg-white py-1 shadow-float',
						align === 'right' ? 'right-0' : 'left-0',
						panelClassName,
					)}
				>
					{children(() => setOpen(false))}
				</div>
			)}
		</div>
	);
};

/** one row of a Dropdown */
export const DropdownItem = ({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
	<button
		type={'button'}
		role={'menuitem'}
		className={cx(
			'flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-4 py-2.5 text-left font-sans text-sm text-text hover:bg-surface [&_svg]:text-[18px]',
			className,
		)}
		{...rest}
	/>
);

export default Dropdown;
