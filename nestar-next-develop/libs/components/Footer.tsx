import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../config';

const Footer = () => {
	const { t } = useTranslation('common');

	const countryLink = (country: string) =>
		`/property?input=${JSON.stringify({ page: 1, limit: 9, sort: 'createdAt', search: { countryList: [country] } })}`;
	return (
		<footer className={'ma-footer'}>
			<div className={'ma-container ma-footer__grid'}>
				<div className={'ma-footer__brand'}>
					<img src="/img/logo/logoDark.svg" alt="MarketAuto" />
					<p>{t('The marketplace connecting car sellers in Uzbekistan and abroad with buyers across Uzbekistan.')}</p>
					<div className={'ma-footer__social'}>
						<TelegramIcon />
						<InstagramIcon />
						<FacebookOutlinedIcon />
					</div>
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
					<span>{SUPPORT_PHONE}</span>
				</div>
			</div>
			<div className={'ma-container ma-footer__bottom'}>
				<span>
					© {moment().year()} MarketAuto. {t('All rights reserved.')}
				</span>
				<span>{t('Tashkent, Uzbekistan')} · {SUPPORT_EMAIL}</span>
			</div>
		</footer>
	);
};

export default Footer;
