import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Seo from '../common/Seo';
import Header from './Header';
import Footer from './Footer';
import CompareBar from '../car/CompareBar';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

const withLayoutFull = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
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
				<Stack id="pc-wrap">
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

export default withLayoutFull;
