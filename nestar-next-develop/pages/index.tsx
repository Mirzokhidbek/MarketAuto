import { NextPage } from 'next';
import withLayoutMain from '../libs/components/layout/LayoutHome';
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
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	return (
		<div className={'home-page'}>
			<HomeHero />
			{/* phones: an app home — reasons, newest cars; the longer sections are for larger screens */}
			<div className={'sm:hidden'}>
				<WhyCarPort />
				<LatestCars />
			</div>
			<div className={'max-sm:hidden'}>
				<CountryHub />
				<CountrySpotlight />
				<HowItWorks />
			</div>
			<TopDealers />
			<div className={'max-sm:hidden'}>
				<SellCta />
			</div>
			<LatestArticles />
			<div className={'max-sm:hidden'}>
				<HomeFaq />
			</div>
		</div>
	);
};

export default withLayoutMain(Home);
