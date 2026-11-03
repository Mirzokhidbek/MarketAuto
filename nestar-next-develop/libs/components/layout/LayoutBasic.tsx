import Link from 'next/link';
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import AppShell from './AppShell';
import { useTranslation } from 'next-i18next/pages';

const withLayoutBasic = (Component: any) => {
	const LayoutBasic = (props: any) => {
		const router = useRouter();
		const { t } = useTranslation('common');

		const memoizedValues = useMemo(() => {
			let title = '',
				desc = '',
				bgImage = '';

			switch (router.pathname) {
				case '/property':
					title = 'Car Search';
					desc = 'Find your next car in Uzbekistan';
					bgImage = '/img/banner/properties.png';
					break;
				case '/agent':
					title = 'Sellers';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/agents.webp';
					break;
				case '/agent/detail':
					title = 'Seller Page';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/mypage':
					title = 'My Page';
					desc = 'Home / My Page';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/community':
					title = 'Community';
					desc = 'Home / Community';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/community/detail':
					title = 'Community Detail';
					desc = 'Home / Community';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/about':
					title = 'About Us';
					desc = 'Home / About Us';
					break;
				case '/cs':
					title = 'Support Center';
					desc = 'Home / Support';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/account/join':
					title = 'Login / Register';
					desc = 'Authentication Process';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/compare':
					title = 'Compare cars';
					desc = 'Home / Compare';
					bgImage = '/img/banner/header1.svg';
					break;
				case '/terms':
					title = 'Terms of Use';
					desc = 'Home / Terms of Use';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/offer':
					title = 'Public Offer';
					desc = 'Home / Public Offer';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/privacy':
					title = 'Privacy Policy';
					desc = 'Home / Privacy Policy';
					bgImage = '/img/banner/header2.svg';
					break;
				case '/member':
					title = 'Seller profile';
					desc = 'Home / Sellers';
					bgImage = '/img/banner/header1.svg';
					break;
				default:
					break;
			}

			return { title, desc, bgImage };
		}, [router.pathname]);

		const breadcrumb = memoizedValues.desc.startsWith('Home / ');

		return (
			<AppShell
				pageHeader={
					// page title on white; "Home / X" descriptions are shown as a real breadcrumb above it.
					// Phones show the title in the app bar, so only the room under the fixed header remains.
					<div className={'border-b border-line bg-white pt-[84px] pb-5 font-sans sm:pt-[104px] sm:pb-7 max-sm:border-0 max-sm:pt-16 max-sm:pb-0'}>
						<div className={'mx-auto w-[1240px] max-w-[calc(100%-32px)] max-sm:hidden sm:max-w-[calc(100%-48px)]'}>
							{breadcrumb && (
								<nav className={'mb-2 flex items-center gap-2 text-[13px] text-muted'} aria-label={'breadcrumb'}>
									<Link href={'/'} className={'text-muted hover:text-primary'}>
										{t('Home')}
									</Link>
									<span>/</span>
									<em className={'overflow-hidden text-ellipsis whitespace-nowrap text-text not-italic'}>{t(memoizedValues.title)}</em>
								</nav>
							)}
							<h1 className={'m-0 text-2xl leading-tight font-bold tracking-[-0.02em] text-ink sm:text-[28px]'}>
								{t(memoizedValues.title)}
							</h1>
							{!breadcrumb && <p className={'mt-1 text-sm text-muted sm:text-[15px]'}>{t(memoizedValues.desc)}</p>}
						</div>
					</div>
				}
			>
				<Component {...props} />
			</AppShell>
		);
	};
	return LayoutBasic;
};

export default withLayoutBasic;
