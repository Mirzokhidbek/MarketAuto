import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { cx } from '../ui/classNames';
import { CancelIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '../ui/icons';

/**
 * Building blocks of the admin panel: cards, list tables (cards on phones), tabs, search,
 * selects, pagination, pills and buttons. Admin pages use these instead of a UI library.
 */

const raised = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)]';

/* ---------- cards ---------- */

export const adminCard = cx('flex min-w-0 flex-col rounded-[20px] border border-ink/4 bg-white p-[18px] md:rounded-3xl md:p-6', raised);

export const AdminCard = ({ className, children, ...rest }: React.HTMLAttributes<HTMLElement>) => (
	<section className={cx(adminCard, className)} {...rest}>
		{children}
	</section>
);

export const CardHead = ({ title, text, action }: { title: React.ReactNode; text?: React.ReactNode; action?: React.ReactNode }) => (
	<div className="mb-[18px] flex flex-wrap items-start justify-between gap-3 md:flex-nowrap">
		<div>
			<h2 className="m-0 text-xl font-bold text-ink">{title}</h2>
			{text && <p className="m-0 mt-1 text-[13px] text-faint">{text}</p>}
		</div>
		{action}
	</div>
);

export const cardEmpty = 'py-7 text-center text-sm text-faint';

/** a white card around a list: tabs, search and the table */
export const tableWrap = cx('overflow-hidden rounded-3xl border border-ink/4 bg-white max-md:overflow-visible', raised);

/* ---------- buttons ---------- */

type AdminButtonVariant = 'contained' | 'outlined' | 'text';
type AdminButtonColor = 'default' | 'success' | 'error' | 'primary';

const buttonTones: Record<AdminButtonVariant, Record<AdminButtonColor, string>> = {
	contained: {
		default: 'border-transparent bg-ink text-white hover:bg-text',
		primary: 'border-transparent bg-ink text-white hover:bg-text',
		success: 'border-transparent bg-[#22a35a] text-white hover:bg-[#1b8a4b]',
		error: 'border-transparent bg-[#e5484d] text-white hover:bg-[#d23a3f]',
	},
	outlined: {
		default: 'border-line-strong bg-white text-text hover:border-ink',
		primary: 'border-primary/50 bg-white text-primary hover:border-primary',
		success: 'border-[#22a35a]/50 bg-white text-[#15803d] hover:border-[#22a35a]',
		error: 'border-[#e5484d]/50 bg-white text-[#c5221f] hover:border-[#e5484d]',
	},
	text: {
		default: 'border-transparent bg-transparent text-text hover:bg-[#f3f5fa]',
		primary: 'border-transparent bg-transparent text-primary hover:bg-[#e9f0ff]',
		success: 'border-transparent bg-transparent text-[#15803d] hover:bg-[#e7f6ec]',
		error: 'border-transparent bg-transparent text-[#c5221f] hover:bg-[#fde8e7]',
	},
};

export const adminButton = ({
	variant = 'contained',
	color = 'default',
	size = 'md',
	className,
}: { variant?: AdminButtonVariant; color?: AdminButtonColor; size?: 'sm' | 'md'; className?: string } = {}) =>
	cx(
		'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border font-sans font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[#e2e8f0] disabled:text-[#94a3b8] [&_svg]:text-lg',
		size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-sm',
		buttonTones[variant][color],
		className,
	);

/* ---------- pills ---------- */

export type PillTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

export const pillTones: Record<PillTone, string> = {
	success: 'bg-[#e7f6ec] text-[#15803d]',
	warning: 'bg-[#fef3e2] text-[#b45309]',
	error: 'bg-[#fde8e7] text-[#c5221f]',
	neutral: 'bg-[#f3f5fa] text-[#475569]',
	info: 'bg-[#e9f0ff] text-[#1d4ed8]',
};

export const pill = (tone: PillTone = 'neutral', className?: string) =>
	cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-semibold whitespace-nowrap', pillTones[tone], className);

/**
 * A coloured status that is also a select: picking another option changes it.
 * A native select is never cut off by the table's scroll box and is easy to use on phones.
 */
export const StatusMenu = <V extends string>({
	value,
	label,
	tone,
	options,
	onSelect,
}: {
	value: V;
	label: React.ReactNode;
	tone: PillTone;
	/** the other values the status can be changed to */
	options: { value: V; label: React.ReactNode }[];
	onSelect: (value: V) => void;
}) => (
	<select
		className={cx(
			'h-7 max-w-[200px] cursor-pointer rounded-full border-0 px-2.5 text-center font-sans text-xs font-semibold',
			pillTones[tone],
		)}
		value={value}
		onChange={(e) => onSelect(e.target.value as V)}
	>
		<option value={value}>{label as string}</option>
		{options.map((option) => (
			<option key={option.value} value={option.value}>
				{option.label as string}
			</option>
		))}
	</select>
);

/* ---------- tabs, search, select ---------- */

export const AdminTabs = <V extends string>({
	items,
	value,
	onChange,
	className,
}: {
	items: { value: V; label: React.ReactNode }[];
	value: V;
	onChange: (value: V) => void;
	className?: string;
}) => (
	<div
		role="tablist"
		className={cx(
			'mx-4 mt-4 mb-1 flex gap-1 overflow-x-auto rounded-full bg-[#f3f5fa] p-1 [scrollbar-width:none] md:mx-6 md:mt-5 md:inline-flex md:flex-wrap',
			className,
		)}
	>
		{items.map((item) => (
			<button
				key={item.value}
				type="button"
				role="tab"
				aria-selected={item.value === value}
				onClick={() => onChange(item.value)}
				className={cx(
					'shrink-0 cursor-pointer rounded-full border-0 px-4 py-2 font-sans text-[13px] font-semibold whitespace-nowrap',
					item.value === value ? 'bg-white text-ink shadow-[0_1px_3px_rgba(15,23,42,0.1)]' : 'bg-transparent text-faint hover:text-ink',
				)}
			>
				{item.label}
			</button>
		))}
	</div>
);

/** the row under the tabs: search box, filters */
export const searchArea = 'm-4 flex flex-wrap gap-3 border-t border-line pt-4 md:m-6 md:flex-nowrap md:pt-6 max-md:[&>*]:w-full';

export const AdminSearch = ({
	value,
	onChange,
	placeholder,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) => {
	const { t } = useTranslation('common');
	return (
		<label
			className={cx(
				'flex h-[46px] min-w-0 flex-1 items-center gap-2 rounded-full border border-transparent bg-[#f3f5fa] px-4 focus-within:border-[#1d4ed8] hover:border-line',
				className,
			)}
		>
			<SearchIcon className="shrink-0 text-xl text-faint" />
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="min-w-0 flex-1 border-0 bg-transparent font-sans text-sm text-ink outline-none"
			/>
			{value && (
				<button
					type="button"
					className="flex cursor-pointer border-0 bg-transparent p-0 text-faint hover:text-ink"
					onClick={() => onChange('')}
					aria-label={t('Clear') as string}
				>
					<CancelIcon className="text-xl" />
				</button>
			)}
		</label>
	);
};

export const adminSelect =
	'h-[46px] cursor-pointer rounded-full border border-transparent bg-[#f3f5fa] px-4 font-sans text-sm text-ink outline-none hover:border-line focus:border-[#1d4ed8]';

export const AdminSelect = <V extends string | number>({
	value,
	onChange,
	options,
	className,
	...rest
}: {
	value: V;
	onChange: (value: V) => void;
	options: { value: V; label: React.ReactNode }[];
	className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>) => (
	<select
		className={cx(adminSelect, className)}
		value={value}
		onChange={(e) => onChange((typeof value === 'number' ? Number(e.target.value) : e.target.value) as V)}
		{...rest}
	>
		{options.map((option) => (
			<option key={option.value} value={option.value}>
				{option.label as string}
			</option>
		))}
	</select>
);

/* ---------- form fields ---------- */

const control =
	'w-full rounded-[14px] border border-line-strong bg-white px-3.5 font-sans text-sm text-ink outline-none focus:border-[#1d4ed8] focus:shadow-[0_0_0_3px_rgba(29,78,216,0.12)] disabled:bg-[#f3f5fa]';
export const adminInput = cx(control, 'h-11');
export const adminTextarea = cx(control, 'min-h-24 resize-y py-2.5');

/** label + input (or textarea / select passed as children) + a hint line */
export const AdminField = ({
	label,
	hint,
	className,
	children,
}: {
	label: React.ReactNode;
	hint?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) => (
	<label className={cx('flex min-w-0 flex-col gap-1.5 font-sans', className)}>
		<span className="text-xs leading-[1.3] font-semibold text-[#475569]">{label}</span>
		{children}
		{hint && <small className="text-xs text-faint">{hint}</small>}
	</label>
);

/* ---------- list tables ---------- */

/**
 * List table; under 900px every row turns into a card: the header row is hidden and each cell
 * shows its data-label on the left. Mark the title cell, the checkbox cell and the actions cell
 * with tdTitle / tdCheck / tdActions.
 */
export const adminTable = cx(
	'w-full border-collapse font-sans text-sm text-[#475569] md:min-w-[750px]',
	'max-md:table-fixed max-md:[&_thead]:hidden max-md:[&_tbody]:block max-md:[&_tr]:block max-md:[&_td]:block',
	'max-md:[&_tbody>tr]:relative max-md:[&_tbody>tr]:my-3 max-md:[&_tbody>tr]:rounded-2xl max-md:[&_tbody>tr]:border max-md:[&_tbody>tr]:border-[#edf0f6] max-md:[&_tbody>tr]:bg-white max-md:[&_tbody>tr]:px-3.5 max-md:[&_tbody>tr]:py-3',
	'max-md:[&_td]:flex! max-md:[&_td]:flex-wrap max-md:[&_td]:items-center max-md:[&_td]:justify-end max-md:[&_td]:gap-x-2 max-md:[&_td]:gap-y-0.5 max-md:[&_td]:border-0! max-md:[&_td]:px-0! max-md:[&_td]:py-1.5! max-md:[&_td]:text-right!',
	"max-md:[&_td[data-label]]:before:mr-auto max-md:[&_td[data-label]]:before:shrink-0 max-md:[&_td[data-label]]:before:text-left max-md:[&_td[data-label]]:before:text-[11px] max-md:[&_td[data-label]]:before:font-bold max-md:[&_td[data-label]]:before:tracking-[0.04em] max-md:[&_td[data-label]]:before:text-faint max-md:[&_td[data-label]]:before:uppercase max-md:[&_td[data-label]]:before:content-[attr(data-label)]",
	'max-md:[&_td[colspan]]:justify-center max-md:[&_td[colspan]]:text-center!',
);

export const th =
	'border-b border-[#edf0f6] px-4 py-3 text-left text-[11px] font-bold tracking-[0.06em] whitespace-nowrap text-faint uppercase first:pl-6 last:pr-6';
export const tr = 'border-b border-[#edf0f6] last:border-b-0 hover:bg-[#f8faff]';
export const td = 'px-4 py-3 align-middle first:pl-6 last:pr-6';
// the [tbody>tr>&] selectors outrank the table's own phone-card rules for every cell
export const tdTitle =
	'max-md:[tbody>tr>&]:block! max-md:[tbody>tr>&]:pr-10! max-md:[tbody>tr>&]:text-left! max-md:[&_*]:whitespace-normal max-md:[&_*]:[overflow-wrap:anywhere]';
export const tdCheck =
	'w-[50px] max-md:[tbody>tr>&]:absolute max-md:[tbody>tr>&]:top-1 max-md:[tbody>tr>&]:right-1 max-md:[tbody>tr>&]:w-auto max-md:[tbody>tr>&]:p-0!';
export const tdActions =
	'max-md:[tbody>tr>&]:mt-1.5 max-md:[tbody>tr>&]:border-t! max-md:[tbody>tr>&]:border-[#edf0f6]! max-md:[tbody>tr>&]:pt-3!';

/** the table scrolls sideways on its own instead of the page; on phones the rows are cards */
export const TableScroll = ({ children }: { children: React.ReactNode }) => (
	<div className="overflow-x-auto max-md:overflow-visible max-md:px-3">{children}</div>
);

export const NoRows = ({ colSpan, children }: { colSpan: number; children: React.ReactNode }) => (
	<tr>
		<td colSpan={colSpan} className={cx(td, 'py-10 text-center text-base text-faint')}>
			{children}
		</td>
	</tr>
);

/** column header with an (i): what the column means */
export const ThHint = ({ hint, children }: { hint: string; children: React.ReactNode }) => (
	<span className="inline-flex cursor-help items-center gap-1" title={hint}>
		{children}
		<span aria-hidden className="text-[13px] text-faint">
			ⓘ
		</span>
	</span>
);

export const caption = 'block text-xs text-muted';
export const thumb = 'h-10 w-14 shrink-0 rounded-[10px] bg-[#f3f5fa] object-cover';
export const avatar = 'size-8 shrink-0 rounded-full object-cover';

/* ---------- pagination ---------- */

export const AdminPager = ({
	total,
	page,
	limit,
	onPage,
	onLimit,
	options = [10, 20, 40, 60],
}: {
	total: number;
	/** 1-based */
	page: number;
	limit: number;
	onPage: (page: number) => void;
	onLimit?: (limit: number) => void;
	options?: number[];
}) => {
	const { t } = useTranslation('common');
	const from = total ? (page - 1) * limit + 1 : 0;
	const to = Math.min(total, page * limit);
	const nav =
		'inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text hover:bg-[#f3f5fa] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent';
	return (
		<div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-t border-[#edf0f6] px-4 py-2.5 font-sans text-[13px] text-faint md:px-6">
			{onLimit && (
				<label className="flex items-center gap-2">
					{t('Rows per page')}
					<select
						className="cursor-pointer rounded-md border-0 bg-transparent font-sans text-[13px] text-ink"
						value={limit}
						onChange={(e) => onLimit(Number(e.target.value))}
					>
						{options.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>
			)}
			<span className="tabular-nums">
				{from}–{to} / {total}
			</span>
			<span className="flex gap-1">
				<button className={nav} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('Previous page') as string}>
					<ChevronLeftIcon fontSize="small" />
				</button>
				<button className={nav} disabled={to >= total} onClick={() => onPage(page + 1)} aria-label={t('Next page') as string}>
					<ChevronRightIcon fontSize="small" />
				</button>
			</span>
		</div>
	);
};

/* ---------- misc ---------- */

export const checkbox = 'size-[18px] cursor-pointer accent-ink';

/** selectable chip (ready-made reasons) */
export const chip = (active: boolean) =>
	cx(
		'inline-flex h-8 cursor-pointer items-center rounded-full border px-3 font-sans text-[13px] font-medium',
		active ? 'border-ink bg-ink text-white' : 'border-line-strong bg-white text-text hover:border-ink',
	);
