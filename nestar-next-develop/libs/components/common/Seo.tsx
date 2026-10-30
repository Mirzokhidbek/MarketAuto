import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { SITE_URL } from '../../config';

interface SeoProps {
	title?: string; // already translated, page specific (e.g. a car name)
	description?: string;
	image?: string; // absolute URL
}

// default title per route; layouts render this, pages with real data render <Seo> again to override it
const routeTitles: Record<string, string> = {
	'/': 'Buy and sell cars in Uzbekistan',
	'/property': 'Car Search',
	'/property/detail': 'Car details',
	'/agent': 'Sellers',
	'/mypage': 'My Page',
	'/member': 'Seller profile',
	'/community': 'Community',
	'/community/detail': 'Community',
	'/about': 'About Us',
	'/cs': 'Support Center',
	'/account/join': 'Login / Register',
	'/compare': 'Compare cars',
	'/terms': 'Terms of Use',
	'/privacy': 'Privacy Policy',
};

// share preview for pages without their own photo (needs an absolute URL)
const DEFAULT_IMAGE = SITE_URL ? `${SITE_URL}/img/brand/og-image.jpg` : undefined;

const ogLocales: Record<string, string> = { en: 'en_US', uz: 'uz_UZ', ru: 'ru_RU' };

/** <title>, description and Open Graph / Twitter tags; `key`s let a page override the layout's tags */
const Seo = ({ title, description, image = DEFAULT_IMAGE }: SeoProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const pageTitle = title ?? t(routeTitles[router.pathname] ?? 'Buy and sell cars in Uzbekistan');
	const fullTitle = `${pageTitle} | CarPort`;
	const desc =
		description ??
		t(
			'Buy and sell new and used cars from sellers in Uzbekistan and abroad. Free listings, direct contact with sellers.',
		);

	return (
		<Head>
			<title key="title">{fullTitle}</title>
			<meta key="description" name="description" content={desc} />
			<meta key="og:title" property="og:title" content={fullTitle} />
			<meta key="og:description" property="og:description" content={desc} />
			<meta key="og:type" property="og:type" content={router.pathname === '/property/detail' ? 'product' : 'website'} />
			<meta key="og:site_name" property="og:site_name" content="CarPort" />
			<meta key="og:locale" property="og:locale" content={ogLocales[router.locale ?? 'en'] ?? 'en_US'} />
			{image && <meta key="og:image" property="og:image" content={image} />}
			<meta key="twitter:card" name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
			{/* private pages must not be indexed */}
			{['/mypage', '/account/join'].includes(router.pathname) && <meta key="robots" name="robots" content="noindex" />}
		</Head>
	);
};

export default Seo;
