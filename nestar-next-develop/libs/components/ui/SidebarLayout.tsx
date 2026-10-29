import React from 'react';
import PageContainer from './PageContainer';

interface SidebarLayoutProps {
	sidebar: React.ReactNode;
	children: React.ReactNode;
}

/** menu column + content (My Page, seller profile); on tablets and phones the menu sits above the content */
const SidebarLayout = ({ sidebar, children }: SidebarLayoutProps) => (
	<div className={'bg-white pt-[88px] pb-20 font-sans text-text md:pt-[104px]'}>
		<PageContainer
			className={'grid grid-cols-1 items-start gap-7 md:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)]'}
		>
			{sidebar}
			<section className={'min-w-0'}>{children}</section>
		</PageContainer>
	</div>
);

export default SidebarLayout;
