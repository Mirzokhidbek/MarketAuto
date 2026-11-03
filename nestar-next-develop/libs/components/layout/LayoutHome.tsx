import React from 'react';
import AppShell from './AppShell';

/** the home page */
const withLayoutMain = (Component: any) => {
	const LayoutHome = (props: any) => (
		<AppShell className={'ma-home'}>
			<Component {...props} />
		</AppShell>
	);
	return LayoutHome;
};

export default withLayoutMain;
