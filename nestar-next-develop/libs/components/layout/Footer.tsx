import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const Footer = () => {
	const { t } = useTranslation('common');
	const site = useSiteSettings();
	// only the networks that are configured (admin panel or .env) are shown
	const socials = [
		{ href: site.telegramUrl, icon: <TelegramIcon />, label: 'Telegram' },
		{ href: site.instagramUrl, icon: <InstagramIcon />, label: 'Instagram' },
		{ href: site.facebookUrl, icon: <FacebookOutlinedIcon />, label: 'Facebook' },
	].filter((item) => !!item.href);

	const countryLink = (country: string) =>
		`/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', search: { countryList: [country] } })}`;
	return (
		<footer className={'ma-footer'}>
			<div className={'ma-container ma-footer__grid'}>
				<div className={'ma-footer__brand'}>
					<img src="/img/logo/logo-tagline.png" alt="CarPort" />
					<p>{t('The marketplace connecting car sellers in Uzbekistan and abroad with buyers across Uzbekistan.')}</p>
					{socials.length > 0 && (
						<div className={'ma-footer__social'}>
							{socials.map(({ href, icon, label }) => (
								<a key={label} href={href} target={'_blank'} rel={'noopener noreferrer'} aria-label={label}>
									{icon}
								</a>
							))}
						</div>
					)}
				</div>
				<div>
					<strong>{t('MARKETPLACE')}</strong>
					<Link href={'/property'}>{t('Browse Cars')}</Link>
					<Link href={countryLink('UZBEKISTAN')}>{t('Cars in Uzbekistan')}</Link>
					<Link href={countryLink('SOUTH_KOREA')}>{t('Cars from South Korea')}</Link>
					<Link href={'/agent'}>{t('Sellers')}</Link>
				</div>
				<div>
					<strong>{t('FOR SELLERS')}</strong>
					<Link href={'/account/join'}>{t('Sell a car')}</Link>
					<Link href={'/mypage'}>{t('My Page')}</Link>
					<Link href={'/community?articleCategory=FREE'}>{t('Community')}</Link>
				</div>
				<div>
					<strong>{t('COMPANY')}</strong>
					<Link href={'/about'}>{t('About Us')}</Link>
					<Link href={'/cs'}>{t('Support Center')}</Link>
					<Link href={'/terms'}>{t('Terms of Use')}</Link>
					<Link href={'/offer'}>{t('Public Offer')}</Link>
					<Link href={'/privacy'}>{t('Privacy Policy')}</Link>
					<a href={site.phoneHref}>{site.phone}</a>
				</div>
			</div>
			<div className={'ma-container ma-footer__bottom'}>
				<span>
					© {moment().year()} CarPort. {t('All rights reserved.')}
				</span>
				<span>{t('Tashkent, Uzbekistan')} · {site.email}</span>
			</div>
		</footer>
	);
};

export default Footer;
