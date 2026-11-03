import React from 'react';
import { cx } from '../ui/classNames';

const columns = {
	2: 'sm:grid-cols-2',
	3: 'sm:grid-cols-2 md:grid-cols-3',
	4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Cards in columns on larger screens; on phones CarCards become rows of one list
 * (divided by lines, no gaps). Also used for other cards (sellers, articles).
 */
const CarGrid = ({
	cols = 3,
	phoneList = true,
	className,
	children,
}: {
	cols?: 2 | 3 | 4;
	/** car rows on phones touch each other (the rows draw their own dividers); false for other cards */
	phoneList?: boolean;
	className?: string;
	children: React.ReactNode;
}) => <div className={cx('grid grid-cols-1 gap-y-8 sm:gap-x-6', phoneList && 'max-sm:gap-y-0', columns[cols], className)}>{children}</div>;

/** sideways row of tile cards on phones (newest cars, similar cars); a normal grid from 600px */
export const CarRow = ({ cols = 3, className, children }: { cols?: 2 | 3 | 4; className?: string; children: React.ReactNode }) => (
	<div
		className={cx(
			'max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:gap-3 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-1 max-sm:[scrollbar-width:none] max-sm:[&>*]:shrink-0 max-sm:[&>*]:grow-0 max-sm:[&>*]:basis-[62%] max-sm:[&>*]:snap-start',
			'sm:grid sm:gap-6',
			columns[cols],
			className,
		)}
	>
		{children}
	</div>
);

export default CarGrid;
