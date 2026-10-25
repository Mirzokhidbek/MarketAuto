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
import useDeviceDetect from '../../hooks/useDeviceDetect';
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
}

const Filter = (props: FilterType) => {
	const { searchFilter, setSearchFilter, initialInput } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [propertyLocation, setPropertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const [propertyType, setPropertyType] = useState<PropertyType[]>(Object.values(PropertyType));
	const [searchText, setSearchText] = useState<string>('');
	const [showMore, setShowMore] = useState<boolean>(false);

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
					await router.push(
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
					await router.push(
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

				console.log('propertyLocationSelectHandler:', e.target.value);
			} catch (err: any) {
				console.log('ERROR, propertyLocationSelectHandler:', err);
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
					await router.push(
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
					await router.push(
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

				console.log('propertyTypeSelectHandler:', e.target.value);
			} catch (err: any) {
				console.log('ERROR, propertyTypeSelectHandler:', err);
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
				await router.push(
					`/property?input=${JSON.stringify(nextFilter)}`,
					`/property?input=${JSON.stringify(nextFilter)}`,
					{ scroll: false },
				);
			} catch (err: any) {
				console.log('ERROR, carListSelectHandler:', err);
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
					await router.push(
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
					await router.push(
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

				console.log('propertyOptionSelectHandler:', e.target.value);
			} catch (err: any) {
				console.log('ERROR, propertyOptionSelectHandler:', err);
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
				await router.push(
					`/property?input=${JSON.stringify(nextFilter)}`,
					`/property?input=${JSON.stringify(nextFilter)}`,
					{ scroll: false },
				);
			} catch (err: any) {
				console.log('ERROR, carRangeHandler:', err);
			}
		},
		[searchFilter],
	);

	const propertyPriceHandler = useCallback(
		async (value: number, type: string) => {
			if (type == 'start') {
				await router.push(
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
				await router.push(
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
			await router.push(
				`/property?input=${JSON.stringify(initialInput)}`,
				`/property?input=${JSON.stringify(initialInput)}`,
				{ scroll: false },
			);
		} catch (err: any) {
			console.log('ERROR, refreshHandler:', err);
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
		<aside className={'ma-filter'}>
			<div className={'ma-filter__head'}>
				<strong>{t('Filters')}</strong>
				<button className={'ma-link-btn'} onClick={refreshHandler}>
					{t('Clear all')}
				</button>
			</div>

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
				<summary>{t('Price')} ($)</summary>
				<div className={'ma-filter__range'}>
					<input
						type="number"
						min={0}
						placeholder={t('Min') as string}
						defaultValue={searchFilter?.search?.pricesRange?.start ?? ''}
						key={`min-${searchFilter?.search?.pricesRange?.start}`}
						onBlur={(e) => propertyPriceHandler(Number(e.target.value) || 0, 'start')}
						onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
					/>
					<span>—</span>
					<input
						type="number"
						min={0}
						placeholder={t('Max') as string}
						defaultValue={searchFilter?.search?.pricesRange?.end ?? ''}
						key={`max-${searchFilter?.search?.pricesRange?.end}`}
						onBlur={(e) => propertyPriceHandler(Number(e.target.value) || 2000000, 'end')}
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
				['propertyBarter', 'propertyRent'],
				searchFilter?.search?.options,
				propertyOptionSelectHandler,
				(item) => t(item === 'propertyBarter' ? 'Barter' : 'Rent'),
			)}
		</aside>
	);
};

export default Filter;
