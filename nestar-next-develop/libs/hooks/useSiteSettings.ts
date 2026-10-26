import { useQuery } from '@apollo/client';
import { GET_SITE_SETTINGS } from '../../apollo/user/query';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../config';

/** support contacts from the admin panel; .env values are the fallback while loading or when a field is empty */
export const useSiteSettings = () => {
	const { data } = useQuery(GET_SITE_SETTINGS, { fetchPolicy: 'cache-first' });
	const saved = data?.getSiteSettings ?? {};
	const phone: string = saved.supportPhone || SUPPORT_PHONE;
	return {
		phone,
		phoneHref: `tel:${phone.replace(/[^+\d]/g, '')}`,
		email: (saved.supportEmail || SUPPORT_EMAIL) as string,
		telegramUrl: (saved.telegramUrl || process.env.NEXT_PUBLIC_TELEGRAM_URL || '') as string,
		instagramUrl: (saved.instagramUrl || process.env.NEXT_PUBLIC_INSTAGRAM_URL || '') as string,
		facebookUrl: (saved.facebookUrl || process.env.NEXT_PUBLIC_FACEBOOK_URL || '') as string,
	};
};
