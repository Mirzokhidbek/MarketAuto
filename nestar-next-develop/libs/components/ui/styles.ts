/**
 * Shared Tailwind class strings for markup that is repeated across pages
 * (form fields, account panels, small link buttons). Buttons live in Button.tsx.
 */

const control =
	'h-[46px] rounded-[10px] border border-line bg-surface px-3.5 font-sans text-sm text-text outline-none transition-[border-color,box-shadow] focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,87,208,0.12)]';

/** a single input / select / textarea on its own */
export const inputClass = control;

/** <label className={field}><span>Label</span><input /></label> */
export const field = [
	'mb-4 flex flex-col gap-1.5 font-sans',
	'[&_span]:text-[13px] [&_span]:font-semibold [&_span]:text-text',
	'[&_input]:h-[46px] [&_input]:rounded-[10px] [&_input]:border [&_input]:border-line [&_input]:bg-surface [&_input]:px-3.5 [&_input]:font-sans [&_input]:text-sm [&_input]:text-text [&_input]:outline-none',
	'[&_input:focus]:border-primary [&_input:focus]:bg-white [&_input:focus]:shadow-[0_0_0_3px_rgba(11,87,208,0.12)]',
	'[&_select]:h-[46px] [&_select]:rounded-[10px] [&_select]:border [&_select]:border-line [&_select]:bg-surface [&_select]:px-3.5 [&_select]:font-sans [&_select]:text-sm [&_select]:text-text [&_select]:outline-none',
	'[&_select:focus]:border-primary [&_select:focus]:bg-white [&_select:focus]:shadow-[0_0_0_3px_rgba(11,87,208,0.12)]',
	'[&_textarea]:min-h-[120px] [&_textarea]:resize-y [&_textarea]:rounded-[10px] [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-surface [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:font-sans [&_textarea]:text-sm [&_textarea]:text-text [&_textarea]:outline-none',
	'[&_textarea:focus]:border-primary [&_textarea:focus]:bg-white [&_textarea:focus]:shadow-[0_0_0_3px_rgba(11,87,208,0.12)]',
].join(' ');

export const fieldLabel = 'mb-2 block font-sans text-[13px] font-semibold text-text';
export const fieldHint = 'mt-1 block text-xs text-muted not-italic';
export const fieldError = 'mt-1 block text-xs text-[#d93025] not-italic';
/** an error line under a whole form or block */
export const formError = 'mt-1 mb-2 text-[13px] text-[#d93025]';

/** form split into titled parts */
export const formSection =
	'border-t border-line py-[22px] first-of-type:border-t-0 first-of-type:pt-0 [&>h2]:m-0 [&>h2]:mb-4 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-ink';
export const formSubtitle = 'mt-[22px] mb-3 text-base text-ink [&_small]:font-normal [&_small]:text-muted';
export const formGrid = 'grid grid-cols-1 gap-x-4 sm:grid-cols-2';
export const formGrid3 = 'grid grid-cols-1 gap-x-4 sm:grid-cols-3';
export const fieldWide = 'sm:col-span-2';
export const formActions = 'mt-2 flex flex-wrap justify-end gap-3 border-t border-line pt-5';

/** text-only button: "Remove", "Clear all", "Forgot password?" */
export const linkButton =
	'cursor-pointer border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50';
export const linkButtonDanger = `${linkButton} text-[#dc2626]`;

/** bordered button with an icon and a short label (like, share, delete) */
export const iconButton =
	'inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 font-sans text-sm font-medium text-text hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:text-xl';
export const iconButtonDanger = `${iconButton} hover:border-[#dc2626] hover:text-[#dc2626]`;

/** My Page / seller profile section: a card on larger screens, plain on phones (the app bar shows the title there) */
export const accountPanel =
	'rounded-[10px] border border-line bg-white p-7 font-sans shadow-[0_1px_2px_rgba(15,23,42,0.04)] max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:pt-1 max-sm:shadow-none';
export const accountPanelHead = [
	'mb-6 flex items-start justify-between gap-4 max-sm:flex-col max-sm:[&:not(:has(>:nth-child(2)))]:hidden',
	'[&>div:first-child>h1]:m-0 [&>div:first-child>h1]:mb-1 [&>div:first-child>h1]:text-2xl [&>div:first-child>h1]:font-bold [&>div:first-child>h1]:text-ink',
	'[&>div:first-child>p]:m-0 [&>div:first-child>p]:text-sm [&>div:first-child>p]:text-muted',
	'max-sm:[&>div:first-child>h1]:hidden max-sm:[&>div:first-child>p]:hidden',
].join(' ');

/** "nothing here" box */
export const emptyBox = 'border-y border-line px-6 py-14 text-center font-sans text-[15px] text-muted';

/** an input with a button next to it ("Send code", "Change") */
export const codeRow = 'flex gap-2 [&_input]:min-w-0 [&_input]:flex-1 [&>button]:min-w-[120px] [&>button]:shrink-0';

/** listing status pill: <span className={`${statusPill} ${statusTone.PENDING}`}> */
export const statusPill = 'inline-flex h-[22px] items-center rounded px-2 text-xs font-semibold';
export const statusTone: Record<string, string> = {
	ACTIVE: 'bg-[#dcfce7] text-[#15803d]',
	SOLD: 'bg-[#f1f5f9] text-muted',
	PENDING: 'bg-[#fef7e0] text-[#7a5200]',
	REJECTED: 'bg-[#fce8e6] text-[#a50e0e]',
	DELETE: 'bg-[#fee2e2] text-[#b91c1c]',
};

/** "no notifications" with a round icon, a bold line and a hint */
export const emptyState =
	'flex flex-col items-center gap-1.5 px-6 py-9 text-center text-[13.5px] leading-normal text-muted [&>svg]:size-12 [&>svg]:rounded-full [&>svg]:bg-[#f1f3f6] [&>svg]:p-2.5 [&>svg]:text-faint [&_strong]:text-[15px] [&_strong]:text-ink';

/** two or three options in a grey pill (Login / Register) */
export const segmented = 'grid grid-cols-2 rounded-xl bg-[#f1f3f6] p-1';
export const segmentButton = (active: boolean) =>
	`h-10 cursor-pointer rounded-[9px] border-0 px-1.5 font-sans text-sm font-semibold whitespace-nowrap ${
		active ? 'bg-white text-ink shadow-[0_1px_3px_rgba(15,23,42,0.12)]' : 'bg-transparent text-muted'
	}`;

/** <details> rows of FAQ, notices and support questions; the last svg in the summary turns when open */
export const faqItem = 'group border-b border-line font-sans first-of-type:border-t';
export const faqSummary =
	'flex cursor-pointer list-none items-center gap-3.5 py-[18px] text-[15.5px] text-ink [&::-webkit-details-marker]:hidden [&>svg:last-child]:shrink-0 [&>svg:last-child]:text-muted [&>svg:last-child]:transition-transform group-open:[&>svg:last-child]:rotate-180';
export const faqBody = 'm-0 max-w-[680px] pb-5 text-[15px] leading-[1.65] whitespace-pre-line text-muted';
