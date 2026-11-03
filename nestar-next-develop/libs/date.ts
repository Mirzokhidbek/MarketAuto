/**
 * Dates in the site language with the built-in Intl API: "03.11.2026", "3 noy 2026", "2 soat oldin".
 * _app sets the language once per page (setDateLocale).
 */

type DateInput = Date | string | number | undefined | null;

let locale = 'uz';

/** uz / ru / en from the router */
export const setDateLocale = (value?: string) => {
	locale = value === 'ru' || value === 'en' ? value : 'uz';
};

const intlLocale = () => locale;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value ?? Date.now()));

const pad = (value: number) => String(value).padStart(2, '0');

const part = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale(), options).format(date);

// many browsers ship Intl without Uzbek names ("M11"), so Uzbek has its own table
const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const UZ_MONTHS_SHORT = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const UZ_DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const UZ_DAYS_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

/** tokens: YYYY MMMM MMM MM DD dddd dd HH mm (the moment.js names) */
export const formatDate = (value: DateInput, pattern: string): string => {
	const date = toDate(value);
	if (Number.isNaN(date.getTime())) return '';
	return pattern.replace(/YYYY|MMMM|MMM|MM|DD|dddd|dd|HH|mm/g, (token) => {
		switch (token) {
			case 'YYYY':
				return String(date.getFullYear());
			case 'MMMM':
				// standalone month name ("Noyabr", "ноябрь"), not the genitive form used inside a full date
				return locale === 'uz' ? UZ_MONTHS[date.getMonth()] : part(date, { month: 'long' });
			case 'MMM':
				return locale === 'uz' ? UZ_MONTHS_SHORT[date.getMonth()] : part(date, { month: 'short' }).replace('.', '');
			case 'MM':
				return pad(date.getMonth() + 1);
			case 'DD':
				return pad(date.getDate());
			case 'dddd':
				return locale === 'uz' ? UZ_DAYS[date.getDay()] : part(date, { weekday: 'long' });
			case 'dd':
				return locale === 'uz' ? UZ_DAYS_SHORT[date.getDay()] : part(date, { weekday: 'short' }).slice(0, 2);
			case 'HH':
				return pad(date.getHours());
			default:
				return pad(date.getMinutes());
		}
	});
};

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

/** moment.js thresholds: 44 s → "a few seconds", 89 s → "1 minute", 21 h → hours, 25 days → days ... */
const span = (seconds: number): [number, Unit] => {
	const s = Math.abs(seconds);
	const minutes = s / 60;
	const hours = minutes / 60;
	const days = hours / 24;
	if (s < 45) return [0, 'second'];
	if (s < 90) return [1, 'minute'];
	if (minutes < 45) return [Math.round(minutes), 'minute'];
	if (minutes < 90) return [1, 'hour'];
	if (hours < 22) return [Math.round(hours), 'hour'];
	if (hours < 36) return [1, 'day'];
	if (days < 26) return [Math.round(days), 'day'];
	if (days < 45) return [1, 'month'];
	if (days < 320) return [Math.round(days / 30.4), 'month'];
	if (days < 548) return [1, 'year'];
	return [Math.round(days / 365), 'year'];
};

// Intl's Uzbek reads "2 kun oldin" too, but it has no "a few seconds"; one table keeps the wording the same everywhere
const UZ_UNITS: Record<Unit, string> = { second: 'soniya', minute: 'daqiqa', hour: 'soat', day: 'kun', month: 'oy', year: 'yil' };
const FEW_SECONDS: Record<string, string> = { uz: 'bir necha soniya', ru: 'несколько секунд', en: 'a few seconds' };

/** "5 daqiqa" / "5 минут" / "5 minutes" without "ago" (reply time) */
export const humanize = (seconds: number): string => {
	const [value, unit] = span(seconds);
	if (unit === 'second') return FEW_SECONDS[locale];
	if (locale === 'uz') return `${value} ${UZ_UNITS[unit]}`;
	return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value);
};

/** "2 soat oldin", "3 дня назад", "in 2 days" */
export const fromNow = (value: DateInput): string => {
	const seconds = (toDate(value).getTime() - Date.now()) / 1000;
	const [amount, unit] = span(seconds);
	const past = seconds <= 0;
	if (locale === 'uz') return past ? `${humanize(seconds)} oldin` : `${humanize(seconds)} dan keyin`;
	if (unit === 'second') return locale === 'ru' ? (past ? 'несколько секунд назад' : 'через несколько секунд') : past ? 'a few seconds ago' : 'in a few seconds';
	return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(past ? -amount : amount, unit);
};

/** midnight of that day, for "Today / Yesterday" groups */
export const startOfDay = (value?: DateInput) => {
	const date = toDate(value);
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
