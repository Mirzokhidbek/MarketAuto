import React, { useEffect } from 'react';
import Seo from '../common/Seo';
import Header from './Header';
import Footer from './Footer';
import MobileTabBar from './MobileTabBar';
import CompareBar from '../car/CompareBar';
import { getJwtToken, updateUserInfo } from '../../auth';
import { cx } from '../ui/classNames';

interface AppShellProps {
	children: React.ReactNode;
	/** a title row under the header (inner pages) */
	pageHeader?: React.ReactNode;
	className?: string;
}

/**
 * Every public page: fixed header, the page, the compare pill, the footer and (phones) the bottom tab bar.
 * #pc-wrap stays as the page root id: older page styles still address it.
 */
const AppShell = ({ children, pageHeader, className }: AppShellProps) => {
	// the signed-in member is restored from the saved token on every page
	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	return (
		<>
			<Seo />
			<div
				id="pc-wrap"
				className={cx(
					'flex min-h-screen flex-col overflow-x-clip',
					// room for the tab bar on phones; the car page has its own contact bar instead
					'max-sm:pb-[calc(62px+env(safe-area-inset-bottom))] max-sm:[body:has(.ma-contact-bar)_&]:pb-0',
					className,
				)}
			>
				<Header />
				{pageHeader}
				<main id="main" className="flex flex-1 flex-col bg-white">
					{children}
				</main>
				<CompareBar />
				<Footer />
				<MobileTabBar />
			</div>
		</>
	);
};

export default AppShell;
