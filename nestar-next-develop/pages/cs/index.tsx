import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import NoticeList from '../../libs/components/support/NoticeList';
import FaqList from '../../libs/components/support/FaqList';
import InquiryForm from '../../libs/components/support/InquiryForm';
import { useSiteSettings } from '../../libs/hooks/useSiteSettings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

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
		<div className={'ma-page ma-list-page'}>
			<div className={'ma-container ma-cs'}>
				<section className={'ma-cs__main'}>
					<div className={'ma-results__bar'}>
						<div>
							<h2>{t('Support Center')}</h2>
							<span>{t('Answers to common questions and the latest notices')}</span>
						</div>
					</div>
					<div className={'ma-segmented ma-cs__switch'}>
						<button className={tab === 'notice' ? 'is-active' : ''} onClick={() => changeTabHandler('notice')}>
							{t('Notices')}
						</button>
						<button className={tab === 'faq' ? 'is-active' : ''} onClick={() => changeTabHandler('faq')}>
							{t('FAQ')}
						</button>
						<button className={tab === 'inquiry' ? 'is-active' : ''} onClick={() => changeTabHandler('inquiry')}>
							{t('Ask a question')}
						</button>
					</div>
					{tab === 'notice' && <NoticeList />}
					{tab === 'faq' && <FaqList />}
					{tab === 'inquiry' && <InquiryForm />}
				</section>
				<aside className={'ma-panel ma-cs__contact'}>
					<h3>{t('Still need help?')}</h3>
					<p>{t('Ask a question in the Support Center — the answer appears in your account.')}</p>
					<a className={'ma-btn ma-btn--primary ma-btn--block'} href={site.phoneHref}>
						<PhoneOutlinedIcon /> {site.phone}
					</a>
					<a className={'ma-btn ma-btn--outline ma-btn--block'} href={`mailto:${site.email}`}>
						<MailOutlineIcon /> {site.email}
					</a>
					<button className={'ma-btn ma-btn--outline ma-btn--block'} onClick={() => changeTabHandler('inquiry')}>
						{t('Ask a question')}
					</button>
				</aside>
			</div>
		</div>
	);
};

export default withLayoutBasic(CS);
