import React, { useEffect, useRef } from 'react';
import { cx } from './classNames';

interface DialogProps {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	children: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
	/** max width of the window */
	size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'max-w-[420px]', md: 'max-w-[560px]', lg: 'max-w-[840px]' };

/**
 * Modal window on the native <dialog>: focus stays inside, Escape and a click on the backdrop close it.
 * On phones it opens as a bottom sheet.
 */
const Dialog = ({ open, onClose, title, children, actions, className, size = 'md' }: DialogProps) => {
	const ref = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	return (
		<dialog
			ref={ref}
			onCancel={(e) => {
				e.preventDefault();
				onClose();
			}}
			onClick={(e) => {
				// a click on the backdrop lands on the <dialog> itself
				if (e.target === ref.current) onClose();
			}}
			className={cx(
				'm-auto w-[calc(100%-32px)] rounded-[16px] border-0 bg-white p-0 font-sans text-text shadow-float backdrop:bg-ink/45',
				'max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none',
				widths[size],
				className,
			)}
		>
			{open && (
				<div className="flex max-h-[85vh] flex-col">
					{title && <h2 className="m-0 px-6 pt-5 pb-2 text-lg font-bold text-ink">{title}</h2>}
					<div className="overflow-y-auto px-6 py-3">{children}</div>
					{actions && (
						<div className="flex flex-wrap justify-end gap-2.5 px-6 pt-2 pb-5 max-sm:pb-[calc(20px+env(safe-area-inset-bottom))]">
							{actions}
						</div>
					)}
				</div>
			)}
		</dialog>
	);
};

export default Dialog;
