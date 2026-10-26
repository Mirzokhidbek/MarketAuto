import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import withLayoutFull from '../libs/components/layout/LayoutFull';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale ?? 'uz', ['common'])) },
});

/** our own "page not found" with a way back to the cars instead of the default Next.js screen */
const NotFound = () => {
	const { t } = useTranslation('common');
	return (
		<div className={'ma-page'}>
			<div className={'ma-container ma-404'}>
				<DirectionsCarFilledOutlinedIcon />
				<h1>404</h1>
				<p>{t('This page does not exist or the listing was removed.')}</p>
				<div className={'ma-404__actions'}>
					<Link href={'/property'}>
						<span className={'ma-btn ma-btn--primary'}>{t('Browse cars')}</span>
					</Link>
					<Link href={'/'}>
						<span className={'ma-btn ma-btn--outline'}>{t('Home')}</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default withLayoutFull(NotFound);
