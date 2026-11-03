import { NextPage } from 'next';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import { Stack } from '@mui/material';
import HomeHero from '../libs/components/homepage/HomeHero';
import CountryHub from '../libs/components/homepage/CountryHub';
import {
	CountrySpotlight,
	HomeFaq,
	HowItWorks,
	SellCta,
	LatestArticles,
	TopDealers,
} from '../libs/components/homepage/HomeSections';
import { LatestCars, WhyCarPort } from '../libs/components/homepage/PhoneHome';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	return (
		<Stack className={'home-page ma-page'}>
			<HomeHero />
			{/* phones: an app home — reasons, newest cars; the longer sections are for larger screens */}
			<div className={'ma-phone-only'}>
				<WhyCarPort />
				<LatestCars />
			</div>
			<div className={'ma-phone-hide'}>
				<CountryHub />
				<CountrySpotlight />
				<HowItWorks />
			</div>
			<TopDealers />
			<div className={'ma-phone-hide'}>
				<SellCta />
			</div>
			<LatestArticles />
			<div className={'ma-phone-hide'}>
				<HomeFaq />
			</div>
		</Stack>
	);
};

export default withLayoutMain(Home);
