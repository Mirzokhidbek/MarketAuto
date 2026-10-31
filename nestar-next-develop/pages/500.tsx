import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import withLayoutFull from '../libs/components/layout/LayoutFull';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale ?? 'uz', ['common'])) },
});

/** our own "something went wrong" page instead of the default Next.js screen */
const ServerError = () => {
	const { t } = useTranslation('common');
	return (
		<div className={'ma-page'}>
			<div className={'ma-container ma-404'}>
				<ReportProblemOutlinedIcon />
				<h1>500</h1>
				<p>{t('Something went wrong on our side. Please try again in a minute.')}</p>
				<div className={'ma-404__actions'}>
					<button type="button" className={'ma-btn ma-btn--primary'} onClick={() => window.location.reload()}>
						{t('Try again')}
					</button>
					<Link href={'/'}>
						<span className={'ma-btn ma-btn--outline'}>{t('Home')}</span>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default withLayoutFull(ServerError);
