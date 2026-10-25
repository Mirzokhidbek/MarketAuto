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
import RefreshIcon from '@mui/icons-material/Refresh';

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
	const device = useDeviceDetect();
	const router = useRouter();
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

	if (device === 'mobile') {
		return <div>CARS FILTER</div>;
	} else {
		return (
			<Stack className={'filter-main'}>
				<Stack className={'find-your-home'} mb={'40px'}>
					<Typography className={'title-main'}>Find Your Car</Typography>
					<Stack className={'input-box'}>
						<OutlinedInput
							value={searchText}
							type={'text'}
							className={'search-input'}
							placeholder={'What are you looking for?'}
							onChange={(e: any) => setSearchText(e.target.value)}
							onKeyDown={(event: any) => {
								if (event.key == 'Enter') {
									setSearchFilter({
										...searchFilter,
										search: { ...searchFilter.search, text: searchText },
									});
								}
							}}
							endAdornment={
								<>
									<CancelRoundedIcon
										onClick={() => {
											setSearchText('');
											setSearchFilter({
												...searchFilter,
												search: { ...searchFilter.search, text: '' },
											});
										}}
									/>
								</>
							}
						/>
						<img src={'/img/icons/search_icon.png'} alt={''} />
						<Tooltip title="Reset">
							<IconButton onClick={refreshHandler}>
								<RefreshIcon />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Country</Typography>
					<Stack style={{ maxHeight: '253px', overflowY: 'auto' }}>
						{Object.values(CarCountry).map((item: string) => (
							<Stack className={'input-box'} key={item}>
								<Checkbox
									id={item}
									className="property-checkbox"
									color="default"
									size="small"
									value={item}
									onChange={(e: any) => carListSelectHandler(e, 'countryList')}
									checked={(searchFilter?.search?.countryList || []).includes(item as CarCountry)}
								/>
								<label htmlFor={item} style={{ cursor: 'pointer' }}>
									<Typography className="property_type">{formatCountry(item)}</Typography>
								</label>
							</Stack>
						))}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<p className={'title'} style={{ textShadow: '0px 3px 4px #b9b9b9' }}>
						City
					</p>
					<Stack
						className={`property-location`}
						style={{ height: showMore ? '253px' : '115px' }}
						onMouseEnter={() => setShowMore(true)}
						onMouseLeave={() => {
							if (!searchFilter?.search?.locationList) {
								setShowMore(false);
							}
						}}
					>
						{propertyLocation.map((location: string) => {
							return (
								<Stack className={'input-box'} key={location}>
									<Checkbox
										id={location}
										className="property-checkbox"
										color="default"
										size="small"
										value={location}
										checked={(searchFilter?.search?.locationList || []).includes(location as PropertyLocation)}
										onChange={propertyLocationSelectHandler}
									/>
									<label htmlFor={location} style={{ cursor: 'pointer' }}>
										<Typography className="property-type">{formatEnumLabel(location)}</Typography>
									</label>
								</Stack>
							);
						})}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Body Type</Typography>
					{propertyType.map((type: string) => (
						<Stack className={'input-box'} key={type}>
							<Checkbox
								id={type}
								className="property-checkbox"
								color="default"
								size="small"
								value={type}
								onChange={propertyTypeSelectHandler}
								checked={(searchFilter?.search?.typeList || []).includes(type as PropertyType)}
							/>
							<label style={{ cursor: 'pointer' }}>
								<Typography className="property_type">{formatEnumLabel(type)}</Typography>
							</label>
						</Stack>
					))}
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Brand</Typography>
					<Stack style={{ maxHeight: '253px', overflowY: 'auto' }}>
						{Object.values(CarBrand).map((item: string) => (
							<Stack className={'input-box'} key={item}>
								<Checkbox
									id={item}
									className="property-checkbox"
									color="default"
									size="small"
									value={item}
									onChange={(e: any) => carListSelectHandler(e, 'brandList')}
									checked={(searchFilter?.search?.brandList || []).includes(item as CarBrand)}
								/>
								<label htmlFor={item} style={{ cursor: 'pointer' }}>
									<Typography className="property_type">{formatEnumLabel(item)}</Typography>
								</label>
							</Stack>
						))}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Fuel</Typography>
					<Stack style={{ maxHeight: '253px', overflowY: 'auto' }}>
						{Object.values(CarFuel).map((item: string) => (
							<Stack className={'input-box'} key={item}>
								<Checkbox
									id={item}
									className="property-checkbox"
									color="default"
									size="small"
									value={item}
									onChange={(e: any) => carListSelectHandler(e, 'fuelList')}
									checked={(searchFilter?.search?.fuelList || []).includes(item as CarFuel)}
								/>
								<label htmlFor={item} style={{ cursor: 'pointer' }}>
									<Typography className="property_type">{formatEnumLabel(item)}</Typography>
								</label>
							</Stack>
						))}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Transmission</Typography>
					<Stack style={{ maxHeight: '253px', overflowY: 'auto' }}>
						{Object.values(CarTransmission).map((item: string) => (
							<Stack className={'input-box'} key={item}>
								<Checkbox
									id={item}
									className="property-checkbox"
									color="default"
									size="small"
									value={item}
									onChange={(e: any) => carListSelectHandler(e, 'transmissionList')}
									checked={(searchFilter?.search?.transmissionList || []).includes(item as CarTransmission)}
								/>
								<label htmlFor={item} style={{ cursor: 'pointer' }}>
									<Typography className="property_type">{formatEnumLabel(item)}</Typography>
								</label>
							</Stack>
						))}
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Options</Typography>
					<Stack className={'input-box'}>
						<Checkbox
							id={'Barter'}
							className="property-checkbox"
							color="default"
							size="small"
							value={'propertyBarter'}
							checked={(searchFilter?.search?.options || []).includes('propertyBarter')}
							onChange={propertyOptionSelectHandler}
						/>
						<label htmlFor={'Barter'} style={{ cursor: 'pointer' }}>
							<Typography className="propert-type">Barter</Typography>
						</label>
					</Stack>
					<Stack className={'input-box'}>
						<Checkbox
							id={'Rent'}
							className="property-checkbox"
							color="default"
							size="small"
							value={'propertyRent'}
							checked={(searchFilter?.search?.options || []).includes('propertyRent')}
							onChange={propertyOptionSelectHandler}
						/>
						<label htmlFor={'Rent'} style={{ cursor: 'pointer' }}>
							<Typography className="propert-type">Rent</Typography>
						</label>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Year</Typography>
					<Stack className="square-year-input">
						<FormControl>
							<InputLabel>Min</InputLabel>
							<Select
								value={searchFilter?.search?.yearsRange?.start ?? carYears[0]}
								label="Min"
								onChange={(e: any) => carRangeHandler(e.target.value, 'start', 'yearsRange')}
								MenuProps={MenuProps}
							>
								{carYears.map((item: number) => (
									<MenuItem
										value={item}
										disabled={(searchFilter?.search?.yearsRange?.end ?? carYears[carYears.length - 1]) < item}
										key={item}
									>
										{item}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<div className="central-divider"></div>
						<FormControl>
							<InputLabel>Max</InputLabel>
							<Select
								value={searchFilter?.search?.yearsRange?.end ?? carYears[carYears.length - 1]}
								label="Max"
								onChange={(e: any) => carRangeHandler(e.target.value, 'end', 'yearsRange')}
								MenuProps={MenuProps}
							>
								{carYears.map((item: number) => (
									<MenuItem
										value={item}
										disabled={(searchFilter?.search?.yearsRange?.start ?? carYears[0]) > item}
										key={item}
									>
										{item}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'} mb={'30px'}>
					<Typography className={'title'}>Mileage</Typography>
					<Stack className="square-year-input">
						<FormControl>
							<InputLabel>Min</InputLabel>
							<Select
								value={searchFilter?.search?.mileageRange?.start ?? propertyMileage[0]}
								label="Min"
								onChange={(e: any) => carRangeHandler(e.target.value, 'start', 'mileageRange')}
								MenuProps={MenuProps}
							>
								{propertyMileage.map((item: number) => (
									<MenuItem
										value={item}
										disabled={
											(searchFilter?.search?.mileageRange?.end ?? propertyMileage[propertyMileage.length - 1]) < item
										}
										key={item}
									>
										{formatMileage(item)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<div className="central-divider"></div>
						<FormControl>
							<InputLabel>Max</InputLabel>
							<Select
								value={searchFilter?.search?.mileageRange?.end ?? propertyMileage[propertyMileage.length - 1]}
								label="Max"
								onChange={(e: any) => carRangeHandler(e.target.value, 'end', 'mileageRange')}
								MenuProps={MenuProps}
							>
								{propertyMileage.map((item: number) => (
									<MenuItem
										value={item}
										disabled={(searchFilter?.search?.mileageRange?.start ?? propertyMileage[0]) > item}
										key={item}
									>
										{formatMileage(item)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
				</Stack>
				<Stack className={'find-your-home'}>
					<Typography className={'title'}>Price Range</Typography>
					<Stack className="square-year-input">
						<input
							type="number"
							placeholder="$ min"
							min={0}
							value={searchFilter?.search?.pricesRange?.start ?? 0}
							onChange={(e: any) => {
								if (e.target.value >= 0) {
									propertyPriceHandler(e.target.value, 'start');
								}
							}}
						/>
						<div className="central-divider"></div>
						<input
							type="number"
							placeholder="$ max"
							value={searchFilter?.search?.pricesRange?.end ?? 0}
							onChange={(e: any) => {
								if (e.target.value >= 0) {
									propertyPriceHandler(e.target.value, 'end');
								}
							}}
						/>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Filter;
