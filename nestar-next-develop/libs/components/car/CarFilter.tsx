import Swal from 'sweetalert2';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { currencyVar, usdRateVar, userVar } from '../../../apollo/store';
import { GET_CAR_MODELS } from '../../../apollo/user/query';
import { SAVE_SEARCH } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { CarBrand, CarCountry, CarFuel, CarTransmission, PropertyLocation, PropertyType } from '../../enums/property.enum';
import { PropertiesInquiry } from '../../types/property/property.input';
import { propertyMileage, propertyYears } from '../../config';
import { formatEnumLabel, formatMileage } from '../../utils';
import CarOrigin from './CarOrigin';
import { buttonClasses } from '../ui/Button';
import { cx } from '../ui/classNames';
import { BellRingIcon, CancelIcon, CloseIcon, SearchIcon, TuneIcon } from '../ui/icons';

type ListKey = 'countryList' | 'brandList' | 'typeList' | 'fuelList' | 'transmissionList' | 'locationList' | 'options';
type RangeKey = 'yearsRange' | 'mileageRange';

const carYears: number[] = propertyYears.map((year: string) => Number(year));

const optionLabels: Record<string, string> = {
	carCustomsCleared: 'Customs cleared',
	propertyNegotiable: 'Negotiable',
	propertyBarter: 'Barter',
};

interface CarFilterProps {
	searchFilter: PropertiesInquiry;
	setSearchFilter: (filter: PropertiesInquiry) => void;
	initialInput: PropertiesInquiry;
	total?: number;
}

const field =
	'h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 font-sans text-[13px] text-text outline-none focus:border-primary';

/** the filters of the car list; on phones and tablets a sheet that opens over the list */
const CarFilter = ({ searchFilter, setSearchFilter, initialInput, total = 0 }: CarFilterProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const currency = useReactiveVar(currencyVar);
	const usdRate = useReactiveVar(usdRateVar);
	const search: Record<string, any> = searchFilter?.search ?? {};
	const [searchText, setSearchText] = useState<string>(search.text ?? '');
	const [modelText, setModelText] = useState<string>(search.model ?? '');
	// phones / tablets: the groups are folded so the results are visible right away
	const [open, setOpen] = useState<boolean>(false);
	const [saveSearch] = useMutation<any>(SAVE_SEARCH);
	// model suggestions once exactly one brand is ticked
	const singleBrand = search.brandList?.length === 1 ? search.brandList[0] : null;
	const { data: modelsData } = useQuery<any>(GET_CAR_MODELS, { skip: !singleBrand, variables: { brand: singleBrand } });
	const models: string[] = modelsData?.getCarModels ?? [];

	// count only what the visitor changed (default price / mileage ranges are not "filters")
	const activeFilters = Object.entries(search).filter(
		([key, value]) =>
			key !== 'text' &&
			(Array.isArray(value) ? value.length > 0 : !!value) &&
			JSON.stringify(value) !== JSON.stringify((initialInput?.search as any)?.[key]),
	).length;

	// the open sheet covers the page: the page under it must not scroll
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	/** every change goes into the address (shareable, back button works); empty values are dropped */
	const pushSearch = async (patch: Record<string, any>) => {
		const next: Record<string, any> = { ...search, ...patch };
		Object.keys(next).forEach((key) => {
			const value = next[key];
			if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) delete next[key];
		});
		const input = JSON.stringify({ ...searchFilter, page: 1, search: next });
		await router.replace(`/property?input=${input}`, `/property?input=${input}`, { scroll: false });
	};

	const toggle = (key: ListKey, value: string, checked: boolean) => {
		const current: string[] = search[key] ?? [];
		return pushSearch({ [key]: checked ? [...current, value] : current.filter((item) => item !== value) });
	};

	const setRange = (key: RangeKey, side: 'start' | 'end', value: number) => {
		const defaults = key === 'yearsRange' ? carYears : propertyMileage;
		const current = search[key] ?? { start: defaults[0], end: defaults[defaults.length - 1] };
		return pushSearch({ [key]: { ...current, [side]: value } });
	};

	/** prices are stored in USD; the inputs follow the currency chosen in the header */
	const toDisplay = (usd?: number) => (usd === undefined ? '' : currency === 'UZS' ? Math.round(usd * usdRate) : usd);
	const toUsd = (value: number) => (currency === 'UZS' ? Math.round(value / usdRate) : value);
	const setPrice = (side: 'start' | 'end', value: number) => pushSearch({ pricesRange: { ...search.pricesRange, [side]: value } });

	const clearAll = async () => {
		setSearchText('');
		setModelText('');
		await router.replace(`/property?input=${JSON.stringify(initialInput)}`, `/property?input=${JSON.stringify(initialInput)}`, {
			scroll: false,
		});
	};

	const saveSearchHandler = async () => {
		try {
			if (!user?._id) {
				await router.replace('/account/join');
				return;
			}
			const { value: title } = await Swal.fire({
				title: t('Save this search') as string,
				text: t('We will notify you when a new car matches these filters.') as string,
				input: 'text',
				inputValue: [...(search.brandList ?? []), search.model].filter(Boolean).join(' ') || '',
				inputPlaceholder: t('e.g. Kia K5 from Korea') as string,
				showCancelButton: true,
				confirmButtonText: t('Save') as string,
				cancelButtonText: t('Cancel') as string,
				confirmButtonColor: '#015dea',
				inputValidator: (value: string) => (!value || value.trim().length < 2 ? (t('Enter a name') as string) : null),
			});
			if (!title) return;
			await saveSearch({ variables: { input: { title: title.trim(), search: JSON.stringify(search) } } });
			await sweetTopSmallSuccessAlert(t('Search saved') as string, 1200);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** a foldable group (summary + content), open by default */
	const group = (title: React.ReactNode, children: React.ReactNode, key?: string) => (
		<details className="group border-t border-line py-3.5" open key={key}>
			<summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink after:size-2 after:rotate-45 after:border-r-2 after:border-b-2 after:border-muted after:transition-transform group-open:after:-rotate-[135deg] [&::-webkit-details-marker]:hidden">
				{title}
			</summary>
			{children}
		</details>
	);

	const checkList = (
		title: string,
		key: ListKey,
		items: string[],
		format: (item: string) => React.ReactNode = (item) => formatEnumLabel(item, t),
	) =>
		group(
			t(title),
			<div className="mt-2.5 flex max-h-[220px] flex-col gap-0.5 overflow-y-auto">
				{items.map((item) => (
					<label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm text-text hover:bg-surface" key={item}>
						<input
							type="checkbox"
							className="size-4 cursor-pointer accent-primary"
							checked={(search[key] ?? []).includes(item)}
							onChange={(e) => toggle(key, item, e.target.checked)}
						/>
						<span>{format(item)}</span>
					</label>
				))}
			</div>,
			key,
		);

	const rangeSelect = (title: string, key: RangeKey, options: number[], format: (n: number) => string) => {
		const start = search[key]?.start ?? options[0];
		const end = search[key]?.end ?? options[options.length - 1];
		return group(
			t(title),
			<div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
				<select className={field} value={start} onChange={(e) => setRange(key, 'start', Number(e.target.value))}>
					{options.map((item) => (
						<option value={item} disabled={item > end} key={item}>
							{format(item)}
						</option>
					))}
				</select>
				<span className="text-muted">—</span>
				<select className={field} value={end} onChange={(e) => setRange(key, 'end', Number(e.target.value))}>
					{options.map((item) => (
						<option value={item} disabled={item < start} key={item}>
							{format(item)}
						</option>
					))}
				</select>
			</div>,
			key,
		);
	};

	return (
		<aside
			className={cx(
				'font-sans [scrollbar-width:thin]',
				'md:sticky md:top-[88px] md:max-h-[calc(100vh-116px)] md:overflow-y-auto md:border-r md:border-line md:pr-6 md:pb-6',
				open
					? 'max-md:fixed max-md:inset-0 max-md:z-[1300] max-md:overflow-y-auto max-md:bg-white max-md:px-4 max-md:pb-24'
					: 'max-md:border-b max-md:border-line max-md:pb-4 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-2 max-sm:border-0 max-sm:pb-0',
			)}
		>
			<div
				className={cx(
					'mb-4 flex items-center justify-between',
					open ? 'max-md:sticky max-md:top-0 max-md:z-[2] max-md:-mx-4 max-md:mb-3 max-md:border-b max-md:border-line max-md:bg-white max-md:px-4 max-md:py-3.5' : 'max-sm:hidden',
				)}
			>
				<strong className={cx('text-[15px] text-ink', open && 'max-md:text-lg')}>{t('Filters')}</strong>
				<div className="flex items-center gap-3">
					<button type="button" className="cursor-pointer border-0 bg-transparent font-sans text-[13px] font-semibold text-primary hover:underline" onClick={clearAll}>
						{t('Clear all')}
					</button>
					{open && (
						<button
							type="button"
							className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-surface text-ink md:hidden"
							onClick={() => setOpen(false)}
							aria-label={t('Close') as string}
						>
							<CloseIcon fontSize="small" />
						</button>
					)}
				</div>
			</div>

			{!open && (
				<button
					type="button"
					className={buttonClasses({ variant: 'outline', className: 'mb-3.5 w-full md:hidden max-sm:order-2 max-sm:mb-0 max-sm:w-auto max-sm:px-3.5' })}
					onClick={() => setOpen(true)}
				>
					<TuneIcon /> {t('Filters')}
					{activeFilters > 0 && (
						<em className="inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-primary px-1.5 text-xs text-white not-italic">
							{activeFilters}
						</em>
					)}
				</button>
			)}

			<div className={cx('relative mb-2 flex items-center', !open && 'max-sm:order-1 max-sm:mb-0')}>
				<SearchIcon className="absolute left-3 text-xl text-muted" />
				<input
					className="h-[42px] w-full rounded-md border border-line-strong bg-white pr-9 pl-10 font-sans text-sm outline-none focus:border-primary"
					value={searchText}
					type={'text'}
					placeholder={t('Search by title') as string}
					onChange={(e) => setSearchText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, text: searchText } });
					}}
				/>
				{searchText && (
					<button
						type="button"
						className="absolute right-2.5 flex cursor-pointer border-0 bg-transparent p-0 text-muted"
						aria-label={t('Clear') as string}
						onClick={() => {
							setSearchText('');
							setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, text: '' } });
						}}
					>
						<CancelIcon fontSize="small" />
					</button>
				)}
			</div>

			<div className={cx(!open && 'max-md:hidden')}>
				{checkList('Country', 'countryList', Object.values(CarCountry), (item) => <CarOrigin country={item} />)}
				{checkList('Brand', 'brandList', Object.values(CarBrand))}
				{checkList('Body type', 'typeList', Object.values(PropertyType))}

				{group(
					t('Model'),
					<div className="mt-2.5">
						<input
							className="h-[42px] w-full rounded-md border border-line-strong bg-white px-3 font-sans text-sm outline-none focus:border-primary"
							value={modelText}
							type={'text'}
							list={'ma-model-options'}
							placeholder={(singleBrand ? t('e.g. K5, Cobalt') : t('Choose one brand for hints')) as string}
							onChange={(e) => setModelText(e.target.value)}
							onBlur={() => modelText !== (search.model ?? '') && pushSearch({ model: modelText.trim() })}
							onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
						/>
						<datalist id={'ma-model-options'}>
							{models.map((model) => (
								<option value={model} key={model} />
							))}
						</datalist>
					</div>,
				)}

				{group(
					<>
						{t('Price')} ({currency === 'UZS' ? t("so'm") : '$'})
					</>,
					<div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
						<input
							className={field}
							type="number"
							min={0}
							placeholder={t('Min') as string}
							defaultValue={toDisplay(search.pricesRange?.start)}
							key={`min-${search.pricesRange?.start}-${currency}`}
							onBlur={(e) => setPrice('start', toUsd(Number(e.target.value) || 0))}
							onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
						/>
						<span className="text-muted">—</span>
						<input
							className={field}
							type="number"
							min={0}
							placeholder={t('Max') as string}
							defaultValue={toDisplay(search.pricesRange?.end)}
							key={`max-${search.pricesRange?.end}-${currency}`}
							onBlur={(e) => setPrice('end', Number(e.target.value) ? toUsd(Number(e.target.value)) : 2000000)}
							onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
						/>
					</div>,
				)}

				{rangeSelect('Year', 'yearsRange', carYears, (n) => String(n))}
				{rangeSelect('Mileage', 'mileageRange', propertyMileage, formatMileage)}
				{checkList('Fuel', 'fuelList', Object.values(CarFuel))}
				{checkList('Transmission', 'transmissionList', Object.values(CarTransmission))}
				{checkList('City (Uzbekistan)', 'locationList', Object.values(PropertyLocation))}
				{checkList('Options', 'options', Object.keys(optionLabels), (item) => t(optionLabels[item]))}

				<label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-3 text-sm text-text hover:bg-surface">
					<input
						type="checkbox"
						className="size-4 cursor-pointer accent-primary"
						checked={!!search.noAccident}
						onChange={(e) => pushSearch({ noAccident: e.target.checked || undefined })}
					/>
					<span>{t('No accidents only')}</span>
				</label>

				<button type="button" className={buttonClasses({ variant: 'outline', block: true, className: 'mt-3 [&_svg]:text-lg max-md:mt-4' })} onClick={saveSearchHandler}>
					<BellRingIcon /> {t('Save search & get alerts')}
				</button>
			</div>

			{/* phones / tablets: closes the sheet and shows the results */}
			{open && (
				<div className="fixed inset-x-0 bottom-0 border-t border-line bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:hidden">
					<button type="button" className={buttonClasses({ block: true })} onClick={() => setOpen(false)}>
						{t('Show {{count}} cars', { count: total })}
					</button>
				</div>
			)}
		</aside>
	);
};

export default CarFilter;
