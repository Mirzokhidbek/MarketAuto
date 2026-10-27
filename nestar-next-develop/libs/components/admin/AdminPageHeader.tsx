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
	<header className={'ma-admin-head'}>
		<div>
			<h1>{title}</h1>
			{description && <p>{description}</p>}
		</div>
		{action && <div className={'ma-admin-head__action'}>{action}</div>}
	</header>
);

export default AdminPageHeader;
