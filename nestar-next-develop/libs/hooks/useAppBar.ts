import { ReactNode, useEffect } from 'react';
import { makeVar } from '@apollo/client';

/** what a page puts into the phone app bar ("← Title   actions"); empty = the default title of the route */
export interface AppBarState {
	title?: string;
	actions?: ReactNode;
}

export const appBarVar = makeVar<AppBarState>({});

/** a page's own app bar title and buttons on phones (e.g. the car name with share and like) */
export const useAppBar = (state: AppBarState, deps: unknown[]): void => {
	useEffect(() => {
		appBarVar(state);
		return () => {
			appBarVar({});
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
};

// default titles (translation keys) of the inner pages
const TITLES: Record<string, string> = {
	'/property': 'Cars',
	'/property/detail': 'Cars',
	'/agent': 'Sellers',
	'/agent/detail': 'Seller Page',
	'/member': 'Seller profile',
	'/community': 'Community',
	'/community/detail': 'Community',
	'/about': 'About Us',
	'/cs': 'Support Center',
	'/account/join': 'Login / Register',
	'/compare': 'Compare cars',
	'/terms': 'Terms of Use',
	'/offer': 'Public Offer',
	'/privacy': 'Privacy Policy',
	'/mypage': 'Profile',
};

// my page sections (?category=...)
const MY_PAGE: Record<string, string> = {
	addProperty: 'Add Car',
	myProperties: 'My Cars',
	myFavorites: 'My Favorites',
	recentlyVisited: 'Recently Visited',
	myArticles: 'My Articles',
	writeArticle: 'Write Article',
	myProfile: 'My Profile',
	messages: 'Messages',
	savedSearches: 'Saved searches',
	notifications: 'Notifications',
	followers: 'Followers',
	followings: 'Followings',
};

export const defaultPageTitle = (pathname: string, category?: string): string =>
	pathname === '/mypage' && category ? MY_PAGE[category] ?? 'Profile' : TITLES[pathname] ?? '';
