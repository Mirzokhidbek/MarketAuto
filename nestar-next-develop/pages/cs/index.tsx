import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import NoticeList from '../../libs/components/support/NoticeList';
import FaqList from '../../libs/components/support/FaqList';
import InquiryForm from '../../libs/components/support/InquiryForm';
import { useSiteSettings } from '../../libs/hooks/useSiteSettings';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { PhoneIcon as PhoneOutlinedIcon, MailIcon as MailOutlineIcon } from '../../libs/components/ui/icons';
import { buttonClasses } from '../../libs/components/ui/Button';
import PageContainer from '../../libs/components/ui/PageContainer';
import { segmentButton, segmented } from '../../libs/components/ui/styles';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CS: NextPage = () => {
	const { t } = useTranslation('common');
	const site = useSiteSettings();
	const router = useRouter();

	/** HANDLERS **/
	const changeTabHandler = (tab: string) => {
		router.push(
			{
				pathname: '/cs',
				query: { tab: tab },
			},
			undefined,
			{ scroll: false },
		);
	};
	const tab = router.query.tab ?? 'notice';

	return (
		<div className="pt-8 pb-20 font-sans">
			<PageContainer className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-7">
				<section className="min-w-0">
					<div className="mb-5 border-b border-line pb-4">
						<div>
							<h2 className="m-0 mb-1 text-lg font-bold tracking-[-0.01em] text-ink sm:text-xl">{t('Support Center')}</h2>
							<span className="text-sm text-muted">{t('Answers to common questions and the latest notices')}</span>
						</div>
					</div>
					<div className={`${segmented} mb-5 max-w-[520px] grid-cols-3`}>
						<button className={segmentButton(tab === 'notice')} onClick={() => changeTabHandler('notice')}>
							{t('Notices')}
						</button>
						<button className={segmentButton(tab === 'faq')} onClick={() => changeTabHandler('faq')}>
							{t('FAQ')}
						</button>
						<button className={segmentButton(tab === 'inquiry')} onClick={() => changeTabHandler('inquiry')}>
							{t('Ask a question')}
						</button>
					</div>
					{tab === 'notice' && <NoticeList />}
					{tab === 'faq' && <FaqList />}
					{tab === 'inquiry' && <InquiryForm />}
				</section>
				<aside className="rounded-[10px] border border-line bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:sticky md:top-24">
					<h3 className="m-0 mb-2 text-lg text-ink">{t('Still need help?')}</h3>
					<p className="m-0 mb-4 text-sm leading-relaxed text-muted">{t('Ask a question in the Support Center — the answer appears in your account.')}</p>
					<a className={buttonClasses({ block: true, className: 'mt-2.5' })} href={site.phoneHref}>
						<PhoneOutlinedIcon /> {site.phone}
					</a>
					<a className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })} href={`mailto:${site.email}`}>
						<MailOutlineIcon /> {site.email}
					</a>
					<button className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })} onClick={() => changeTabHandler('inquiry')}>
						{t('Ask a question')}
					</button>
				</aside>
			</PageContainer>
		</div>
	);
};

export default withLayoutBasic(CS);
