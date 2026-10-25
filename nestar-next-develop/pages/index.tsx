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
	WhyUs,
} from '../libs/components/homepage/HomeSections';
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
			<CountryHub />
			<CountrySpotlight />
			<WhyUs />
			<HowItWorks />
			<TopDealers />
			<SellCta />
			<LatestArticles />
			<HomeFaq />
		</Stack>
	);
};

export default withLayoutMain(Home);
