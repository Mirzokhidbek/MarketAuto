export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;

/** public address of the site, used for absolute links in share previews (Open Graph) */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

/** support contacts shown in the footer, home page and Support page — set real values in .env */
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+998 71 200 00 00';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@marketauto.uz';
export const supportPhoneHref = `tel:${SUPPORT_PHONE.replace(/[^+\d]/g, '')}`;

export const availableOptions = ['propertyBarter', 'propertyNegotiable', 'carCustomsCleared'];

const thisYear = new Date().getFullYear();

export const propertyYears: any = [];

for (let i = 1970; i <= thisYear; i++) {
	propertyYears.push(String(i));
}

export const propertyMileage = [0, 10000, 30000, 50000, 100000, 150000, 200000, 300000, 500000];

export const Messages = {
	error1: 'Something went wrong!',
	error2: 'Please login first!',
	error3: 'Please fulfill all inputs!',
	error4: 'Message is empty!',
	error5: 'Only images with jpeg, jpg, png format allowed!',
};

export const topPropertyRank = 3;
