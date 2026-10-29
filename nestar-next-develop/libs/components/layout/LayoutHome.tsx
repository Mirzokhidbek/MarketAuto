import React, { useEffect } from 'react';
import Seo from '../common/Seo';
import Header from './Header';
import Footer from './Footer';
import CompareBar from '../car/CompareBar';
import { Stack } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { getJwtToken, updateUserInfo } from '../../auth';

const withLayoutMain = (Component: any) => {
	return (props: any) => {
		const user = useReactiveVar(userVar);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
		}, []);

		/** HANDLERS **/

		return (
			<>
				<Seo />
				<Stack id="pc-wrap" className={'ma-home'}>
					<Stack id={'top'}>
						<Header />
					</Stack>

					<Stack id={'main'}>
						<Component {...props} />
					</Stack>

					<CompareBar />

					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};
};

export default withLayoutMain;
