import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import withLayoutFull from '../libs/components/layout/LayoutFull';
import { ReportIcon as ReportProblemOutlinedIcon } from '../libs/components/ui/icons';
import { buttonClasses } from '../libs/components/ui/Button';
import PageContainer from '../libs/components/ui/PageContainer';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale ?? 'uz', ['common'])) },
});

/** our own "something went wrong" page instead of the default Next.js screen */
const ServerError = () => {
	const { t } = useTranslation('common');
	return (
		<div className="pt-[88px] font-sans md:pt-[104px]">
			<PageContainer className="flex flex-col items-center gap-2 pt-[90px] pb-[110px] text-center">
				<ReportProblemOutlinedIcon className="text-[72px] text-[#cbd5e1]" />
				<h1 className="m-0 text-[64px] text-ink">500</h1>
				<p className="m-0 mb-3.5 text-muted">{t('Something went wrong on our side. Please try again in a minute.')}</p>
				<div className="flex gap-3">
					<button type="button" className={buttonClasses()} onClick={() => window.location.reload()}>
						{t('Try again')}
					</button>
					<Link href={'/'} className={buttonClasses({ variant: 'outline' })}>
						{t('Home')}
					</Link>
				</div>
			</PageContainer>
		</div>
	);
};

export default withLayoutFull(ServerError);
