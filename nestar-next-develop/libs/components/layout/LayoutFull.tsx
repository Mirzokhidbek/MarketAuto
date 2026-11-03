import React from 'react';
import AppShell from './AppShell';

/** pages that draw their own top (car page, my page, auth, ...) */
const withLayoutFull = (Component: any) => {
	const LayoutFull = (props: any) => (
		<AppShell>
			<Component {...props} />
		</AppShell>
	);
	return LayoutFull;
};

export default withLayoutFull;
