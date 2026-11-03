import React from 'react';

interface AdminPageHeaderProps {
	title: string;
	/** one sentence: what this page is for */
	description?: string;
	/** main action of the page, e.g. "Add" */
	action?: React.ReactNode;
}

/** same header on every admin page: title, what the page is for, main action on the right */
const AdminPageHeader = ({ title, description, action }: AdminPageHeaderProps) => (
	<header className="mt-3 mb-[22px] flex flex-wrap items-end justify-between gap-4 font-sans">
		<div>
			<h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-[#0f172a] md:text-[32px]">{title}</h1>
			{description && <p className="m-0 mt-1.5 max-w-[720px] text-sm leading-normal text-faint">{description}</p>}
		</div>
		{action && <div>{action}</div>}
	</header>
);

export default AdminPageHeader;
