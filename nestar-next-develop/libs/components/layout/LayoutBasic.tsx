import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Seo from '../common/Seo';
import Top from '../Top';
import Footer from '../Footer';
import CompareBar from '../common/CompareBar';
import { Stack } from '@mui/material';
import { getJwtToken, updateUserInfo } from '../../auth';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useTranslation } from 'next-i18next';

const withLayoutBasic = (Component: any) => {
	return (props: any) => {
		const router = useRouter();
		const { t, i18n } = useTranslation('common');
		const [authHeader, setAuthHeader] = useState<boolean>(false);
		const user = useReactiveVar(userVar);

		const memoizedValues = useMemo(() => {
			let title = '',
				desc = '',
				bgImage = '';

			switch (router.pathname) {
				case '/property':
					title = 'Car Search';
					desc = 'Find your next car in Uzbekistan';
					bgImage = '/img/banner/properties.png';
					break;
				case '/agent':
					title = 'Sellers';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/agents.webp';
					break;
				case '/agent/detail':
					title = 'Seller Page';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/mypage':
					title = 'My Page';
					desc = 'Home / My Page';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/community':
					title = 'Community';
					desc = 'Home / Community';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/community/detail':
					title = 'Community Detail';
					desc = 'Home / Community';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/about':
					title = 'About Us';
					desc = 'Home / About Us';
					break;
				case '/cs':
					title = 'Support Center';
					desc = 'Home / Support';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/account/join':
					title = 'Login / Register';
					desc = 'Authentication Process';
					bgImage = '/img/banner/header2.svg';
					setAuthHeader(true);
					break;
				case '/compare':
					title = 'Compare cars';
					desc = 'Home / Compare';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/terms':
					title = 'Terms of Use';
					desc = 'Home / Terms of Use';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/privacy':
					title = 'Privacy Policy';
					desc = 'Home / Privacy Policy';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/member':
					title = 'Seller profile';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/header1.svg';
					break;
				default:
					break;
			}

			return { title, desc, bgImage };
		}, [router.pathname]);

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
						<Top />
					</Stack>

					<Stack
						className={`header-basic ${authHeader && 'auth'}`}
						style={{
							backgroundImage: `url(${memoizedValues.bgImage})`,
							backgroundSize: 'cover',
							boxShadow: 'inset 10px 40px 150px 40px rgb(24 22 36)',
						}}
					>
						<Stack className={'container'}>
							<strong>{t(memoizedValues.title)}</strong>
							<span>{t(memoizedValues.desc)}</span>
						</Stack>
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

export default withLayoutBasic;
