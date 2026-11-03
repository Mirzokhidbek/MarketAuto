import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { joinHref } from '../../utils';
import { FacebookIcon, InstagramIcon, TelegramIcon } from '../ui/icons';

const column = 'flex flex-col gap-2.5 [&_a]:text-sm [&_a]:text-muted [&_a:hover]:text-primary';
const heading = 'mb-1.5 text-[13px] font-bold tracking-[0.06em] text-ink';

/** site footer; hidden inside the Telegram Mini App (the tab bar is the menu there) */
const Footer = () => {
	const { t } = useTranslation('common');
	const site = useSiteSettings();
	// only the networks that are configured (admin panel or .env) are shown
	const socials = [
		{ href: site.telegramUrl, icon: <TelegramIcon />, label: 'Telegram' },
		{ href: site.instagramUrl, icon: <InstagramIcon />, label: 'Instagram' },
		{ href: site.facebookUrl, icon: <FacebookIcon />, label: 'Facebook' },
	].filter((item) => !!item.href);

	const countryLink = (country: string) =>
		`/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', search: { countryList: [country] } })}`;

	return (
		<footer className="w-full border-t border-line bg-surface-alt pt-16 font-sans [.is-telegram_&]:hidden">
			<div className="mx-auto grid w-[1240px] max-w-[calc(100%-32px)] grid-cols-1 gap-7 pb-12 sm:max-w-[calc(100%-48px)] sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:gap-10">
				<div>
					<img src="/img/logo/logo-tagline.png" alt="CarPort" className="mb-3.5 w-[220px]" />
					<p className="mb-[18px] max-w-[300px] text-sm leading-relaxed text-muted">
						{t('The marketplace connecting car sellers in Uzbekistan and abroad with buyers across Uzbekistan.')}
					</p>
					{socials.length > 0 && (
						<div className="flex gap-3 text-muted">
							{socials.map(({ href, icon, label }) => (
								<a key={label} href={href} target={'_blank'} rel={'noopener noreferrer'} aria-label={label} className="hover:text-primary">
									{icon}
								</a>
							))}
						</div>
					)}
				</div>
				<div className={column}>
					<strong className={heading}>{t('MARKETPLACE')}</strong>
					<Link href={'/property'}>{t('Browse Cars')}</Link>
					<Link href={countryLink('UZBEKISTAN')}>{t('Cars in Uzbekistan')}</Link>
					<Link href={countryLink('SOUTH_KOREA')}>{t('Cars from South Korea')}</Link>
					<Link href={'/agent'}>{t('Sellers')}</Link>
				</div>
				<div className={column}>
					<strong className={heading}>{t('FOR SELLERS')}</strong>
					<Link href={joinHref('/mypage?category=addProperty')}>{t('Sell a car')}</Link>
					<Link href={'/mypage'}>{t('My Page')}</Link>
					<Link href={'/community?articleCategory=FREE'}>{t('Community')}</Link>
				</div>
				<div className={column}>
					<strong className={heading}>{t('COMPANY')}</strong>
					<Link href={'/about'}>{t('About Us')}</Link>
					<Link href={'/cs'}>{t('Support Center')}</Link>
					<Link href={'/terms'}>{t('Terms of Use')}</Link>
					<Link href={'/offer'}>{t('Public Offer')}</Link>
					<Link href={'/privacy'}>{t('Privacy Policy')}</Link>
					<a href={site.phoneHref}>{site.phone}</a>
				</div>
			</div>
			<div className="mx-auto flex w-[1240px] max-w-[calc(100%-32px)] flex-col gap-2 border-t border-line pt-[22px] pb-7 text-[13px] text-muted sm:max-w-[calc(100%-48px)] md:flex-row md:justify-between">
				<span>
					© {new Date().getFullYear()} CarPort. {t('All rights reserved.')}
				</span>
				<span>
					{t('Tashkent, Uzbekistan')} · {site.email}
				</span>
			</div>
		</footer>
	);
};

export default Footer;
