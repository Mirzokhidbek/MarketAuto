import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import withLayoutFull from '../libs/components/layout/LayoutFull';
import { CarIcon as DirectionsCarFilledOutlinedIcon } from '../libs/components/ui/icons';
import { buttonClasses } from '../libs/components/ui/Button';
import PageContainer from '../libs/components/ui/PageContainer';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale ?? 'uz', ['common'])) },
});

/** our own "page not found" with a way back to the cars instead of the default Next.js screen */
const NotFound = () => {
	const { t } = useTranslation('common');
	return (
		<div className="pt-[88px] font-sans md:pt-[104px]">
			<PageContainer className="flex flex-col items-center gap-2 pt-[90px] pb-[110px] text-center">
				<DirectionsCarFilledOutlinedIcon className="text-[72px] text-[#cbd5e1]" />
				<h1 className="m-0 text-[64px] text-ink">404</h1>
				<p className="m-0 mb-3.5 text-muted">{t('This page does not exist or the listing was removed.')}</p>
				<div className="flex gap-3">
					<Link href={'/property'} className={buttonClasses()}>
						{t('Browse cars')}
					</Link>
					<Link href={'/'} className={buttonClasses({ variant: 'outline' })}>
						{t('Home')}
					</Link>
				</div>
			</PageContainer>
		</div>
	);
};

export default withLayoutFull(NotFound);
