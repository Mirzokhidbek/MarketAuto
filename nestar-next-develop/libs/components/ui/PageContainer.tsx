import React from 'react';
import { cx } from './classNames';

interface PageContainerProps {
	className?: string;
	children: React.ReactNode;
}

/** centered page column: 1240px wide, 24px side gutters (16px on phones) */
const PageContainer = ({ className, children }: PageContainerProps) => (
	<div className={cx('mx-auto w-page max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)]', className)}>{children}</div>
);

export default PageContainer;
