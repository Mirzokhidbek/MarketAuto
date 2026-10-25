import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { HowItWorks } from '../../libs/components/homepage/HomeSections';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const values = [
	{
		icon: <PublicOutlinedIcon />,
		title: 'Local & International',
		text: 'Cars located in Uzbekistan and abroad — all in one search with clear country labels.',
	},
	{
		icon: <ForumOutlinedIcon />,
		title: 'Direct Contact',
		text: 'Call or message the seller directly. No middlemen and no hidden fees.',
	},
	{
		icon: <SellOutlinedIcon />,
		title: 'Free Listing',
		text: 'Private sellers and dealers can list cars for free in a few minutes.',
	},
	{
		icon: <VerifiedUserOutlinedIcon />,
		title: 'Open Dealer Profiles',
		text: 'Every dealer has a public profile with all their cars, likes, followers and ranking.',
	},
];

const About: NextPage = () => {
	const { t } = useTranslation('common');

	return (
		<div className={'ma-page'}>
			<section className={'ma-section'}>
				<div className={'ma-container ma-about'}>
					<div className={'ma-about__intro'}>
						<span className={'ma-eyebrow'}>{t('ABOUT MARKETAUTO')}</span>
						<h1>{t("We're on a Mission to Make Buying and Selling Cars Simple.")}</h1>
					</div>
					<div className={'ma-about__text'}>
						<p>
							{t(
								'MarketAuto connects car buyers with trusted dealers and private sellers across Uzbekistan and abroad. Every listing shows the details that matter — brand, model, year, mileage, fuel and transmission — so you can compare cars quickly and honestly.',
							)}
						</p>
						<p>
							{t(
								'Whether you are looking for your first Chevrolet Cobalt or a new electric BYD, you can search, filter, save favorites and talk to sellers directly, all in one place.',
							)}
						</p>
					</div>
				</div>
			</section>

			<section className={'ma-section ma-section--alt'}>
				<div className={'ma-container ma-grid ma-grid--4'}>
					{values.map((item) => (
						<div className={'ma-feature'} key={item.title}>
							<div className={'ma-feature__icon'}>{item.icon}</div>
							<h3>{t(item.title)}</h3>
							<p>{t(item.text)}</p>
						</div>
					))}
				</div>
			</section>

			<HowItWorks />

			<section className={'ma-section ma-section--tight'}>
				<div className={'ma-container'}>
					<div className={'ma-cta'}>
						<div className={'ma-cta__text'}>
							<h2>{t('Need help? Talk to our team.')}</h2>
							<p>{t('Our team answers every day from 9:00 to 21:00 (Tashkent time).')}</p>
							<div className={'ma-cta__actions'}>
								<Link href={'/cs'}>
									<span className={'ma-btn ma-btn--primary'}>{t('Support Center')}</span>
								</Link>
								<Link href={'/property'}>
									<span className={'ma-btn ma-btn--ghost'}>{t('Browse Cars')}</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default withLayoutBasic(About);
