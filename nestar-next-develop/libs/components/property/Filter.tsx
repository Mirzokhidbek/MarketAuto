import Swal from 'sweetalert2';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { currencyVar, usdRateVar, userVar } from '../../../apollo/store';
import { GET_CAR_MODELS } from '../../../apollo/user/query';
import { SAVE_SEARCH } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import React, { useCallback, useEffect, useState } from 'react';
import {
	Stack,
	Typography,
	Checkbox,
	Button,
	OutlinedInput,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Tooltip,
	IconButton,
} from '@mui/material';
import {
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyType,
} from '../../enums/property.enum';
import { PropertiesInquiry } from '../../types/property/property.input';
import { useRouter } from 'next/router';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { propertyMileage, propertyYears } from '../../config';
import { formatCountry, formatEnumLabel, formatMileage } from '../../utils';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'next-i18next';

const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: '200px',
		},
	},
};

type CarListKey = 'countryList' | 'brandList' | 'fuelList' | 'transmissionList';
type CarRangeKey = 'yearsRange' | 'mileageRange';

const carYears: number[] = propertyYears.map((year: string) => Number(year));

interface FilterType {
	searchFilter: PropertiesInquiry;
	setSearchFilter: any;
	initialInput: PropertiesInquiry;
	total?: number;
}

const optionLabels: Record<string, string> = {
	carCustomsCleared: 'Customs cleared',
	propertyNegotiable: 'Negotiable',
	propertyBarter: 'Barter',
};

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput, total = 0 } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [propertyLocation, setPropertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const [propertyType, setPropertyType] = useState<PropertyType[]>(Object.values(PropertyType));
	const [searchText, setSearchText] = useState<string>('');
	// on phones the filter groups are folded so the results are visible right away
	const [mobileOpen, setMobileOpen] = useState<boolean>(false);
	// count only what the visitor changed (default price/mileage ranges are not "filters")
	const activeFilters = Object.entries(searchFilter?.search ?? {}).filter(
		([key, value]: [string, any]) =>
			key !== 'text' &&
			(Array.isArray(value) ? value.length > 0 : !!value) &&
			JSON.stringify(value) !== JSON.stringify((initialInput?.search as any)?.[key]),
	).length;
	const [showMore, setShowMore] = useState<boolean>(false);
	const user = useReactiveVar(userVar);
	const currency = useReactiveVar(currencyVar);
	const usdRate = useReactiveVar(usdRateVar);
	const [modelText, setModelText] = useState<string>(searchFilter?.search?.model ?? '');
	const [saveSearch] = useMutation(SAVE_SEARCH);
	// model suggestions once exactly one brand is ticked
	const singleBrand = searchFilter?.search?.brandList?.length === 1 ? searchFilter.search.brandList[0] : null;
	const { data: modelsData } = useQuery(GET_CAR_MODELS, { skip: !singleBrand, variables: { brand: singleBrand } });
	const models: string[] = modelsData?.getCarModels ?? [];

	const pushSearch = async (patch: Record<string, any>) => {
		const search: Record<string, any> = { ...searchFilter.search, ...patch };
		Object.keys(search).forEach((key) => (search[key] === undefined || search[key] === '') && delete search[key]);
		const next = JSON.stringify({ ...searchFilter, page: 1, search });
		await router.replace(`/property?input=${next}`, `/property?input=${next}`, { scroll: false });
	};

	/** prices are stored in USD; the inputs follow the currency chosen in the header */
	const toDisplay = (usd?: number) => (usd === undefined ? '' : currency === 'UZS' ? Math.round(usd * usdRate) : usd);
	const toUsd = (value: number) => (currency === 'UZS' ? Math.round(value / usdRate) : value);

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
				inputValue: [...(searchFilter.search.brandList ?? []), searchFilter.search.model].filter(Boolean).join(' ') || '',
				inputPlaceholder: t('e.g. Kia K5 from Korea') as string,
				showCancelButton: true,
				confirmButtonText: t('Save') as string,
				cancelButtonText: t('Cancel') as string,
				confirmButtonColor: '#0b57d0',
				inputValidator: (value: string) => (!value || value.trim().length < 2 ? (t('Enter a name') as string) : null),
			});
			if (!title) return;
			await saveSearch({ variables: { input: { title: title.trim(), search: JSON.stringify(searchFilter.search) } } });
			await sweetTopSmallSuccessAlert(t('Search saved') as string, 1200);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** LIFECYCLES **/
	useEffect(() => {
		if (searchFilter?.search?.locationList?.length == 0) {
			delete searchFilter.search.locationList;
			setShowMore(false);
			router
				.push(
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					{ scroll: false },
				)
				.then();
		}

		if (searchFilter?.search?.typeList?.length == 0) {
			delete searchFilter.search.typeList;
			router
				.push(
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					{ scroll: false },
				)
				.then();
		}

		(['countryList', 'brandList', 'fuelList', 'transmissionList'] as CarListKey[]).forEach((key) => {
			if (searchFilter?.search?.[key]?.length == 0) {
				delete searchFilter.search[key];
				router
					.push(`/property?input=${JSON.stringify(searchFilter)}`, `/property?input=${JSON.stringify(searchFilter)}`, {
						scroll: false,
					})
					.then();
			}
		});

		if (searchFilter?.search?.options?.length == 0) {
			delete searchFilter.search.options;
			router
				.push(
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
						},
					})}`,
					{ scroll: false },
				)
				.then();
		}

		if (searchFilter?.search?.locationList) setShowMore(true);
	}, [searchFilter]);

	/** HANDLERS **/
	const propertyLocationSelectHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, locationList: [...(searchFilter?.search?.locationList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.locationList?.includes(value)) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								locationList: searchFilter?.search?.locationList?.filter((item: string) => item !== value),
							},
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								locationList: searchFilter?.search?.locationList?.filter((item: string) => item !== value),
							},
						})}`,
						{ scroll: false },
					);
				}

				if (searchFilter?.search?.typeList?.length == 0) {
					alert('error');
				}

			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const propertyTypeSelectHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, typeList: [...(searchFilter?.search?.typeList || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.typeList?.includes(value)) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								typeList: searchFilter?.search?.typeList?.filter((item: string) => item !== value),
							},
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								typeList: searchFilter?.search?.typeList?.filter((item: string) => item !== value),
							},
						})}`,
						{ scroll: false },
					);
				}

				if (searchFilter?.search?.typeList?.length == 0) {
					alert('error');
				}

			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const carListSelectHandler = useCallback(
		async (e: any, key: CarListKey) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				const current: string[] = searchFilter?.search?.[key] || [];
				const nextFilter = {
					...searchFilter,
					search: {
						...searchFilter.search,
						[key]: isChecked ? [...current, value] : current.filter((item: string) => item !== value),
					},
				};
				await router.replace(
					`/property?input=${JSON.stringify(nextFilter)}`,
					`/property?input=${JSON.stringify(nextFilter)}`,
					{ scroll: false },
				);
			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const propertyOptionSelectHandler = useCallback(
		async (e: any) => {
			try {
				const isChecked = e.target.checked;
				const value = e.target.value;
				if (isChecked) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, options: [...(searchFilter?.search?.options || []), value] },
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: { ...searchFilter.search, options: [...(searchFilter?.search?.options || []), value] },
						})}`,
						{ scroll: false },
					);
				} else if (searchFilter?.search?.options?.includes(value)) {
					await router.replace(
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								options: searchFilter?.search?.options?.filter((item: string) => item !== value),
							},
						})}`,
						`/property?input=${JSON.stringify({
							...searchFilter,
							search: {
								...searchFilter.search,
								options: searchFilter?.search?.options?.filter((item: string) => item !== value),
							},
						})}`,
						{ scroll: false },
					);
				}

			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const carRangeHandler = useCallback(
		async (value: number, type: 'start' | 'end', key: CarRangeKey) => {
			try {
				const defaults = key === 'yearsRange' ? carYears : propertyMileage;
				const current = searchFilter?.search?.[key] ?? { start: defaults[0], end: defaults[defaults.length - 1] };
				const nextFilter = {
					...searchFilter,
					search: { ...searchFilter.search, [key]: { ...current, [type]: value } },
				};
				await router.replace(
					`/property?input=${JSON.stringify(nextFilter)}`,
					`/property?input=${JSON.stringify(nextFilter)}`,
					{ scroll: false },
				);
			} catch (err: any) {
			}
		},
		[searchFilter],
	);

	const propertyPriceHandler = useCallback(
		async (value: number, type: string) => {
			if (type == 'start') {
				await router.replace(
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
							pricesRange: { ...searchFilter.search.pricesRange, start: value * 1 },
						},
					})}`,
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
							pricesRange: { ...searchFilter.search.pricesRange, start: value * 1 },
						},
					})}`,
					{ scroll: false },
				);
			} else {
				await router.replace(
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
							pricesRange: { ...searchFilter.search.pricesRange, end: value * 1 },
						},
					})}`,
					`/property?input=${JSON.stringify({
						...searchFilter,
						search: {
							...searchFilter.search,
							pricesRange: { ...searchFilter.search.pricesRange, end: value * 1 },
						},
					})}`,
					{ scroll: false },
				);
			}
		},
		[searchFilter],
	);

	const refreshHandler = async () => {
		try {
			setSearchText('');
			await router.replace(
				`/property?input=${JSON.stringify(initialInput)}`,
				`/property?input=${JSON.stringify(initialInput)}`,
				{ scroll: false },
			);
		} catch (err: any) {
		}
	};

	const checkList = (
		title: string,
		items: string[],
		selected: string[] | undefined,
		onChange: (e: any) => void,
		format: (item: string) => string = (item) => formatEnumLabel(item, t),
	) => (
		<details className={'ma-filter__group'} open>
			<summary>{t(title)}</summary>
			<div className={'ma-filter__list'}>
				{items.map((item) => (
					<label className={'ma-check'} key={item}>
						<input type="checkbox" value={item} checked={(selected || []).includes(item)} onChange={onChange} />
						<span>{format(item)}</span>
					</label>
				))}
			</div>
		</details>
	);

	const rangeSelect = (title: string, key: CarRangeKey, options: number[], format: (n: number) => string) => {
		const start = searchFilter?.search?.[key]?.start ?? options[0];
		const end = searchFilter?.search?.[key]?.end ?? options[options.length - 1];
		return (
			<details className={'ma-filter__group'} open>
				<summary>{t(title)}</summary>
				<div className={'ma-filter__range'}>
					<select value={start} onChange={(e) => carRangeHandler(Number(e.target.value), 'start', key)}>
						{options.map((item) => (
							<option value={item} disabled={item > end} key={item}>
								{format(item)}
							</option>
						))}
					</select>
					<span>—</span>
					<select value={end} onChange={(e) => carRangeHandler(Number(e.target.value), 'end', key)}>
						{options.map((item) => (
							<option value={item} disabled={item < start} key={item}>
								{format(item)}
							</option>
						))}
					</select>
				</div>
			</details>
		);
	};

	return (
		<aside className={`ma-filter ${mobileOpen ? 'is-open' : ''}`}>
			<div className={'ma-filter__head'}>
				<strong>{t('Filters')}</strong>
				{mobileOpen && (
					<button className={'ma-icon-btn ma-filter__close'} onClick={() => setMobileOpen(false)} aria-label={t('Close') as string}>
						✕
					</button>
				)}
				<button className={'ma-link-btn'} onClick={refreshHandler}>
					{t('Clear all')}
				</button>
			</div>
			<button className={'ma-btn ma-btn--outline ma-btn--block ma-filter__toggle'} onClick={() => setMobileOpen(!mobileOpen)}>
				{mobileOpen ? t('Hide filters') : t('Show filters')}
				{activeFilters > 0 && <em className={'ma-filter__count'}>{activeFilters}</em>}
			</button>

			<div className={'ma-filter__search'}>
				<SearchIcon />
				<input
					value={searchText}
					type={'text'}
					placeholder={t('Search by title') as string}
					onChange={(e: any) => setSearchText(e.target.value)}
					onKeyDown={(event: any) => {
						if (event.key == 'Enter') {
							setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, text: searchText } });
						}
					}}
				/>
				{searchText && (
					<CancelRoundedIcon
						className={'ma-filter__clear'}
						onClick={() => {
							setSearchText('');
							setSearchFilter({ ...searchFilter, search: { ...searchFilter.search, text: '' } });
						}}
					/>
				)}
			</div>

			{checkList(
				'Country',
				Object.values(CarCountry),
				searchFilter?.search?.countryList,
				(e) => carListSelectHandler(e, 'countryList'),
				(item: string) => formatCountry(item, t),
			)}
			{checkList('Brand', Object.values(CarBrand), searchFilter?.search?.brandList, (e) =>
				carListSelectHandler(e, 'brandList'),
			)}
			{checkList('Body type', propertyType, searchFilter?.search?.typeList, propertyTypeSelectHandler)}

			<details className={'ma-filter__group'} open>
				<summary>{t('Model')}</summary>
				<div className={'ma-filter__search'}>
					<input
						value={modelText}
						type={'text'}
						list={'ma-model-options'}
						placeholder={(singleBrand ? t('e.g. K5, Cobalt') : t('Choose one brand for hints')) as string}
						onChange={(e) => setModelText(e.target.value)}
						onBlur={() => modelText !== (searchFilter.search.model ?? '') && pushSearch({ model: modelText.trim() })}
						onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
					/>
					<datalist id={'ma-model-options'}>
						{models.map((model) => (
							<option value={model} key={model} />
						))}
					</datalist>
				</div>
			</details>

			<details className={'ma-filter__group'} open>
				<summary>
					{t('Price')} ({currency === 'UZS' ? t("so'm") : '$'})
				</summary>
				<div className={'ma-filter__range'}>
					<input
						type="number"
						min={0}
						placeholder={t('Min') as string}
						defaultValue={toDisplay(searchFilter?.search?.pricesRange?.start)}
						key={`min-${searchFilter?.search?.pricesRange?.start}-${currency}`}
						onBlur={(e) => propertyPriceHandler(toUsd(Number(e.target.value) || 0), 'start')}
						onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
					/>
					<span>—</span>
					<input
						type="number"
						min={0}
						placeholder={t('Max') as string}
						defaultValue={toDisplay(searchFilter?.search?.pricesRange?.end)}
						key={`max-${searchFilter?.search?.pricesRange?.end}-${currency}`}
						onBlur={(e) => propertyPriceHandler(Number(e.target.value) ? toUsd(Number(e.target.value)) : 2000000, 'end')}
						onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
					/>
				</div>
			</details>

			{rangeSelect('Year', 'yearsRange', carYears, (n) => String(n))}
			{rangeSelect('Mileage', 'mileageRange', propertyMileage, formatMileage)}
			{checkList('Fuel', Object.values(CarFuel), searchFilter?.search?.fuelList, (e) =>
				carListSelectHandler(e, 'fuelList'),
			)}
			{checkList('Transmission', Object.values(CarTransmission), searchFilter?.search?.transmissionList, (e) =>
				carListSelectHandler(e, 'transmissionList'),
			)}
			{checkList(
				'City (Uzbekistan)',
				propertyLocation,
				searchFilter?.search?.locationList,
				propertyLocationSelectHandler,
			)}
			{checkList(
				'Options',
				['carCustomsCleared', 'propertyNegotiable', 'propertyBarter'],
				searchFilter?.search?.options,
				propertyOptionSelectHandler,
				(item) => t(optionLabels[item]),
			)}
			<label className={'ma-check ma-filter__single'}>
				<input
					type="checkbox"
					checked={!!searchFilter?.search?.noAccident}
					onChange={(e) => pushSearch({ noAccident: e.target.checked || undefined })}
				/>
				<span>{t('No accidents only')}</span>
			</label>

			{/* phones: the open filter is a full-screen sheet; this closes it and shows the results */}
			<div className={'ma-filter__apply'}>
				<button className={'ma-btn ma-btn--primary ma-btn--block'} onClick={() => setMobileOpen(false)}>
					{t('Show {{count}} cars', { count: total })}
				</button>
			</div>

			<button className={'ma-btn ma-btn--outline ma-btn--block ma-filter__save'} onClick={saveSearchHandler}>
				<NotificationsActiveOutlinedIcon /> {t('Save search & get alerts')}
			</button>
		</aside>
	);
};

export default Filter;
