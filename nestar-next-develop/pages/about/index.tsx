import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { HowItWorks } from '../../libs/components/homepage/HomeSections';
import { PublicIcon as PublicOutlinedIcon, ForumIcon as ForumOutlinedIcon, SellIcon as SellOutlinedIcon, VerifiedUserIcon as VerifiedUserOutlinedIcon } from '../../libs/components/ui/icons';
import { buttonClasses } from '../../libs/components/ui/Button';
import PageContainer from '../../libs/components/ui/PageContainer';

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
		text: 'Call the seller or write a private message. No middlemen and no hidden fees.',
	},
	{
		icon: <SellOutlinedIcon />,
		title: 'Free Listing',
		text: 'Private sellers and dealers can list cars for free in a few minutes.',
	},
	{
		icon: <VerifiedUserOutlinedIcon />,
		title: 'Verified Sellers',
		text: 'Every seller confirms the phone number by SMS, and the first listing of a new seller is checked by our team.',
	},
];

const About: NextPage = () => {
	const { t } = useTranslation('common');

	return (
		<div className="font-sans">
			<section className="py-14 md:py-16">
				<PageContainer className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-14">
					<div>
						<span className="mb-2 block text-[13px] font-semibold text-muted">{t('ABOUT CARPORT')}</span>
						<h1 className="m-0 text-[28px] leading-[1.2] tracking-[-0.02em] text-ink sm:text-[38px]">
							{t("We're on a Mission to Make Buying and Selling Cars Simple.")}
						</h1>
					</div>
					<div className="[&_p]:m-0 [&_p]:mb-4 [&_p]:text-base [&_p]:leading-[1.75] [&_p]:text-text">
						<p>
							{t(
								'CarPort connects car buyers with trusted dealers and private sellers across Uzbekistan and abroad. Every listing shows the details that matter — brand, model, year, mileage, fuel and transmission — so you can compare cars quickly and honestly.',
							)}
						</p>
						<p>
							{t(
								'Whether you are looking for your first Chevrolet Cobalt or a new electric BYD, you can search, filter, save favorites and talk to sellers directly, all in one place.',
							)}
						</p>
					</div>
				</PageContainer>
				<PageContainer className="mt-10">
					<img
						src={'/img/brand/brand.webp'}
						alt={t('CarPort — car import from abroad to Uzbekistan') as string}
						width={872}
						height={492}
						className="block h-auto w-full rounded-[14px] border border-line"
					/>
				</PageContainer>
			</section>

			<section className="border-t border-line bg-white py-14 md:py-16">
				<PageContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{values.map((item) => (
						<div className="border-t border-line pt-6" key={item.title}>
							<div className="mb-3 text-ink [&_svg]:text-[22px]">{item.icon}</div>
							<h3 className="m-0 mb-1.5 text-base font-semibold text-ink">{t(item.title)}</h3>
							<p className="m-0 text-sm leading-relaxed text-muted">{t(item.text)}</p>
						</div>
					))}
				</PageContainer>
			</section>

			<HowItWorks />

			<section className="pb-14 md:pb-16">
				<PageContainer>
					<div className="rounded-[14px] bg-ink px-6 py-8 text-white md:p-12">
						<div className="max-w-[600px]">
							<h2 className="m-0 mb-3 text-[23px] leading-[1.2] font-bold tracking-[-0.02em] sm:text-[28px]">{t('Need help? Talk to our team.')}</h2>
							<p className="m-0 mb-6 text-[15.5px] leading-relaxed text-white/70">
								{t('Ask a question in the Support Center — the answer appears in your account.')}
							</p>
							<div className="flex flex-wrap gap-3">
								<Link href={'/cs'} className={buttonClasses()}>
									{t('Support Center')}
								</Link>
								<Link href={'/property'} className={buttonClasses({ variant: 'ghost' })}>
									{t('Browse Cars')}
								</Link>
							</div>
						</div>
					</div>
				</PageContainer>
			</section>
		</div>
	);
};

export default withLayoutBasic(About);
