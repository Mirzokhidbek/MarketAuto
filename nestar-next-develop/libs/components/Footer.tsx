import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import useDeviceDetect from '../hooks/useDeviceDetect';
import { Stack, Box } from '@mui/material';
import moment from 'moment';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

const Footer = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');

	if (device == 'mobile') {
		return (
			<Stack className={'footer-container'}>
				<Stack className={'main'}>
					<Stack className={'left'}>
						<Box component={'div'} className={'footer-box'}>
							<img src="/img/logo/logoWhite.svg" alt="" className={'logo'} />
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>total free customer care</span>
							<p>+998 71 200 00 00</p>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<span>call center</span>
							<p>+998 71 200 00 00</p>
							<span>Support?</span>
						</Box>
						<Box component={'div'} className={'footer-box'}>
							<p>follow us on social media</p>
							<div className={'media-box'}>
								<FacebookOutlinedIcon />
								<TelegramIcon />
								<InstagramIcon />
								<TwitterIcon />
							</div>
						</Box>
					</Stack>
					<Stack className={'right'}>
						<Box component={'div'} className={'bottom'}>
							<div>
								<strong>Popular Search</strong>
								<span>Cars for Rent</span>
								<span>Cars for Barter</span>
							</div>
							<div>
								<strong>Quick Links</strong>
								<span>Terms of Use</span>
								<span>Privacy Policy</span>
								<span>Pricing Plans</span>
								<span>Our Services</span>
								<span>Contact Support</span>
								<span>FAQs</span>
							</div>
							<div>
								<strong>Discover</strong>
								<span>Tashkent</span>
								<span>Samarkand</span>
								<span>Bukhara</span>
								<span>Fergana</span>
							</div>
						</Box>
					</Stack>
				</Stack>
				<Stack className={'second'}>
					<span>© MarketAuto - All rights reserved. {moment().year()}</span>
				</Stack>
			</Stack>
		);
	} else {
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
						<span>+998 71 200 00 00</span>
					</div>
				</div>
				<div className={'ma-container ma-footer__bottom'}>
					<span>
						© {moment().year()} MarketAuto. {t('All rights reserved.')}
					</span>
					<span>{t('Tashkent, Uzbekistan')} · support@marketauto.uz</span>
				</div>
			</footer>
		);
	}
};

export default Footer;
