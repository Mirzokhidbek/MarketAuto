import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Notice from '../../libs/components/cs/Notice';
import Faq from '../../libs/components/cs/Faq';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CS: NextPage = () => {
	const { t } = useTranslation('common');
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
					</div>
					{tab === 'notice' && <Notice />}
					{tab === 'faq' && <Faq />}
				</section>
				<aside className={'ma-panel ma-cs__contact'}>
					<h3>{t('Still need help?')}</h3>
					<p>{t('Our team answers every day from 9:00 to 21:00 (Tashkent time).')}</p>
					<a className={'ma-btn ma-btn--primary ma-btn--block'} href={'tel:+998712000000'}>
						<PhoneOutlinedIcon /> +998 71 200 00 00
					</a>
					<a className={'ma-btn ma-btn--outline ma-btn--block'} href={'mailto:support@marketauto.uz'}>
						<MailOutlineIcon /> support@marketauto.uz
					</a>
				</aside>
			</div>
		</div>
	);
};

export default withLayoutBasic(CS);
