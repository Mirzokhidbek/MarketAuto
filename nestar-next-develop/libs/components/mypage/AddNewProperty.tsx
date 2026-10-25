import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import {
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyType,
} from '../../enums/property.enum';
import { REACT_APP_API_URL, propertyYears } from '../../config';
import { formatCountry, formatEnumLabel } from '../../utils';
import { PropertyInput } from '../../types/property/property.input';
import axios from 'axios';
import { getJwtToken } from '../../auth';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { CREATE_PROPERTY, UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { GET_PROPERTY } from '../../../apollo/user/query';

const AddProperty = ({ initialValues, ...props }: any) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const inputRef = useRef<any>(null);
	const [insertPropertyData, setInsertPropertyData] = useState<PropertyInput>(initialValues);
	const [propertyType, setPropertyType] = useState<PropertyType[]>(Object.values(PropertyType));
	const [propertyLocation, setPropertyLocation] = useState<PropertyLocation[]>(Object.values(PropertyLocation));
	const isUzbekistan = insertPropertyData.carCountry === CarCountry.UZBEKISTAN;
	const token = getJwtToken();
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const [createProperty] = useMutation(CREATE_PROPERTY);
	const [updateProperty] = useMutation(UPDATE_PROPERTY);

	const {
		loading: getPropertyLoading,
		data: getPropertyData,
		error: getPropertyError,
		refetch: getPropertyRefetch,
	} = useQuery(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: {
			input: router.query.propertyId,
		},
		skip: !router.query.propertyId,
	});

	/** LIFECYCLES **/
	useEffect(() => {
		setInsertPropertyData({
			...insertPropertyData,
			propertyTitle: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyTitle : '',
			propertyPrice: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyPrice : 0,
			propertyType: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyType : '',
			carCountry: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carCountry : '',
			propertyLocation: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyLocation : '',
			carEngine: getPropertyData?.getProperty?.carEngine ?? undefined,
			carTrim: getPropertyData?.getProperty?.carTrim ?? '',
			propertyAddress: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyAddress : '',
			propertyBarter: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyBarter : false,
			propertyRent: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyRent : false,
			carBrand: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carBrand : '',
			carModel: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carModel : '',
			carYear: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carYear : 0,
			carMileage: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carMileage : 0,
			carFuel: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carFuel : '',
			carTransmission: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carTransmission : '',
			carColor: getPropertyData?.getProperty ? getPropertyData?.getProperty?.carColor ?? '' : '',
			propertyDesc: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyDesc : '',
			propertyImages: getPropertyData?.getProperty ? getPropertyData?.getProperty?.propertyImages : [],
		});
	}, [getPropertyLoading, getPropertyData]);

	/** HANDLERS **/
	async function uploadImages() {
		try {
			const formData = new FormData();
			const selectedFiles = inputRef.current.files;

			if (selectedFiles.length == 0) return false;
			if (selectedFiles.length > 5) throw new Error(t('You can upload up to 5 photos.') as string);

			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) { 
						imagesUploader(files: $files, target: $target)
				  }`,
					variables: {
						files: [null, null, null, null, null],
						target: 'property',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.files.0'],
					'1': ['variables.files.1'],
					'2': ['variables.files.2'],
					'3': ['variables.files.3'],
					'4': ['variables.files.4'],
				}),
			);
			for (const key in selectedFiles) {
				if (/^\d+$/.test(key)) formData.append(`${key}`, selectedFiles[key]);
			}

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImages = response.data.data.imagesUploader;

			console.log('+responseImages: ', responseImages);
			setInsertPropertyData({ ...insertPropertyData, propertyImages: responseImages });
		} catch (err: any) {
			console.log('err: ', err.message);
			await sweetMixinErrorAlert(err.message);
		}
	}

	const doDisabledCheck = () => {
		if (
			insertPropertyData.propertyTitle === '' ||
			insertPropertyData.propertyPrice === 0 || // @ts-ignore
			insertPropertyData.propertyType === '' || // @ts-ignore
			!insertPropertyData.carCountry || // @ts-ignore
			(isUzbekistan && !insertPropertyData.propertyLocation) || // @ts-ignore
			insertPropertyData.propertyAddress === '' || // @ts-ignore
			insertPropertyData.propertyBarter === '' || // @ts-ignore
			insertPropertyData.propertyRent === '' || // @ts-ignore
			insertPropertyData.carBrand === '' ||
			insertPropertyData.carModel === '' ||
			insertPropertyData.carYear === 0 || // @ts-ignore
			insertPropertyData.carFuel === '' || // @ts-ignore
			insertPropertyData.carTransmission === '' ||
			insertPropertyData.propertyDesc === '' ||
			insertPropertyData.propertyImages.length === 0
		) {
			return true;
		}
	};

	/** drops empty optional fields and the Uzbek city for cars located abroad **/
	const buildPropertyPayload = (): any => {
		const payload: any = { ...insertPropertyData };
		['carColor', 'carTrim', 'carEngine', 'propertyDesc'].forEach((key) => {
			if (payload[key] === '' || payload[key] === undefined || Number.isNaN(payload[key])) delete payload[key];
		});
		if (payload.carCountry !== CarCountry.UZBEKISTAN) delete payload.propertyLocation;
		return payload;
	};

	const insertPropertyHandler = useCallback(async () => {
		try {
			const result = await createProperty({
				variables: {
					input: buildPropertyPayload(),
				},
			});

			await sweetMixinSuccessAlert(t('This car has been listed successfully.') as string);
			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertPropertyData]);

	const updatePropertyHandler = useCallback(async () => {
		try {
			// @ts-ignore
			insertPropertyData._id = getPropertyData?.getProperty?._id;
			const result = await updateProperty({
				variables: {
					input: buildPropertyPayload(),
				},
			});

			await sweetMixinSuccessAlert(t('This car has been updated successfully.') as string);
			await router.push({
				pathname: '/mypage',
				query: {
					category: 'myProperties',
				},
			});
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [insertPropertyData]);

	// only sellers can list cars; wait until the user is restored from the token
	if (user?._id && user?.memberType !== 'AGENT') {
		router.push('/mypage').then();
	}

	return (
		<div id="add-property-page" className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{router.query.propertyId ? t('Edit Car') : t('Add New Car')}</h1>
					<p>{t('Fill in the details buyers care about most. Fields marked * are required.')}</p>
				</div>
			</div>

			<section className={'ma-form-section'}>
				<h2>1. {t('Basics')}</h2>
				<label className={'ma-input'}>
					<span>{t('Title')} *</span>
					<input
						type="text"
						placeholder={'2023 Kia Sorento Signature'}
						value={insertPropertyData.propertyTitle}
						onChange={({ target: { value } }: any) =>
							setInsertPropertyData({ ...insertPropertyData, propertyTitle: value })
						}
					/>
				</label>
				<div className={'ma-form-grid'}>
					<label className={'ma-input'}>
						<span>{t('Brand *')}</span>
						<select
							value={insertPropertyData.carBrand || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carBrand: value })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{Object.values(CarBrand).map((item: any) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-input'}>
						<span>{t('Model *')}</span>
						<input
							type="text"
							placeholder={'Sorento'}
							value={insertPropertyData.carModel ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carModel: value })
							}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Year *')}</span>
						<select
							value={insertPropertyData.carYear || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carYear: parseInt(value) })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{[...propertyYears].reverse().map((item: any) => (
								<option value={item} key={item}>
									{String(item)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-input'}>
						<span>{t('Body type *')}</span>
						<select
							value={insertPropertyData.propertyType || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, propertyType: value })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{propertyType.map((item: any) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-input'}>
						<span>{t('Price ($) *')}</span>
						<input
							type="number"
							placeholder={'34500'}
							value={insertPropertyData.propertyPrice ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, propertyPrice: parseInt(value) || 0 })
							}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Trim')}</span>
						<input
							type="text"
							placeholder={'AWD, M-Sport, LTZ'}
							value={insertPropertyData.carTrim ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carTrim: value })
							}
						/>
					</label>
				</div>
			</section>

			<section className={'ma-form-section'}>
				<h2>2. {t('Location')}</h2>
				<div className={'ma-form-grid'}>
					<label className={'ma-input'}>
						<span>{t('Country *')}</span>
						<select
							value={insertPropertyData.carCountry || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carCountry: value })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{Object.values(CarCountry).map((item: any) => (
								<option value={item} key={item}>
									{formatCountry(item, t)}
								</option>
							))}
						</select>
					</label>
					{isUzbekistan && (
						<label className={'ma-input'}>
							<span>{t('City *')}</span>
							<select
								value={insertPropertyData.propertyLocation || ''}
								// @ts-ignore
								onChange={({ target: { value } }: any) =>
									setInsertPropertyData({ ...insertPropertyData, propertyLocation: value })
								}
							>
								<option value={''} disabled>
									{t('Select')}
								</option>
								{propertyLocation.map((item: any) => (
									<option value={item} key={item}>
										{formatEnumLabel(item, t)}
									</option>
								))}
							</select>
						</label>
					)}
					<label className={'ma-input'}>
						<span>{isUzbekistan ? t('District / street') : t('City abroad')} *</span>
						<input
							type="text"
							placeholder={isUzbekistan ? 'Chilonzor 9' : 'Incheon, Frankfurt, Dubai...'}
							value={insertPropertyData.propertyAddress}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, propertyAddress: value })
							}
						/>
					</label>
				</div>
			</section>

			<section className={'ma-form-section'}>
				<h2>3. {t('Specifications')}</h2>
				<div className={'ma-form-grid ma-form-grid--3'}>
					<label className={'ma-input'}>
						<span>{t('Mileage (km) *')}</span>
						<input
							type="number"
							placeholder={'35000'}
							value={insertPropertyData.carMileage ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carMileage: parseInt(value) || 0 })
							}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Fuel *')}</span>
						<select
							value={insertPropertyData.carFuel || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carFuel: value })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{Object.values(CarFuel).map((item: any) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-input'}>
						<span>{t('Transmission *')}</span>
						<select
							value={insertPropertyData.carTransmission || ''}
							// @ts-ignore
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carTransmission: value })
							}
						>
							<option value={''} disabled>
								{t('Select')}
							</option>
							{Object.values(CarTransmission).map((item: any) => (
								<option value={item} key={item}>
									{formatEnumLabel(item, t)}
								</option>
							))}
						</select>
					</label>
					<label className={'ma-input'}>
						<span>{t('Engine (L)')}</span>
						<input
							type="number"
							placeholder={'2.0'}
							value={insertPropertyData.carEngine ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({
									...insertPropertyData,
									carEngine: value === '' ? undefined : parseFloat(value),
								})
							}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Color')}</span>
						<input
							type="text"
							placeholder={'White'}
							value={insertPropertyData.carColor ?? ''}
							onChange={({ target: { value } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, carColor: value })
							}
						/>
					</label>
				</div>
				<div className={'ma-switch-row'}>
					<label className={'ma-switch'}>
						<input
							type="checkbox"
							checked={!!insertPropertyData.propertyBarter}
							onChange={({ target: { checked } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, propertyBarter: checked })
							}
						/>
						<span>{t('Open to barter')}</span>
					</label>
					<label className={'ma-switch'}>
						<input
							type="checkbox"
							checked={!!insertPropertyData.propertyRent}
							onChange={({ target: { checked } }: any) =>
								setInsertPropertyData({ ...insertPropertyData, propertyRent: checked })
							}
						/>
						<span>{t('Available for rent')}</span>
					</label>
				</div>
			</section>

			<section className={'ma-form-section'}>
				<h2>4. {t('Description')} *</h2>
				<label className={'ma-input'}>
					<textarea
						placeholder={t('Condition, service history, extras, reason for selling...') as string}
						value={insertPropertyData.propertyDesc}
						onChange={({ target: { value } }: any) =>
							setInsertPropertyData({ ...insertPropertyData, propertyDesc: value })
						}
					></textarea>
				</label>
			</section>

			<section className={'ma-form-section'}>
				<h2>5. {t('Photos')} *</h2>
				<div className={'ma-upload'} onClick={() => inputRef.current.click()}>
					<CloudUploadOutlinedIcon />
					<strong>{t('Click to upload photos')}</strong>
					<span>{t('Up to 5 photos, JPG or PNG. The first photo is the cover.')}</span>
					<input
						ref={inputRef}
						type="file"
						hidden={true}
						onChange={uploadImages}
						multiple={true}
						accept="image/jpg, image/jpeg, image/png"
					/>
				</div>
				{insertPropertyData?.propertyImages?.length > 0 && (
					<div className={'ma-upload__gallery'}>
						{insertPropertyData.propertyImages.map((image: string, index: number) => (
							<div className={'ma-upload__thumb'} key={image}>
								<img src={`${REACT_APP_API_URL}/${image}`} alt={''} />
								{index === 0 && <span className={'ma-badge ma-badge--primary'}>{t('Cover')}</span>}
							</div>
						))}
					</div>
				)}
			</section>

			<div className={'ma-form-actions'}>
				<button className={'ma-btn ma-btn--outline'} onClick={() => router.push('/mypage?category=myProperties')}>
					{t('Cancel')}
				</button>
				<button
					className={'ma-btn ma-btn--primary'}
					disabled={doDisabledCheck()}
					onClick={router.query.propertyId ? updatePropertyHandler : insertPropertyHandler}
				>
					{router.query.propertyId ? t('Save changes') : t('Publish listing')}
				</button>
			</div>
		</div>
	);
};

AddProperty.defaultProps = {
	initialValues: {
		propertyTitle: '',
		propertyPrice: 0,
		propertyType: '',
		carCountry: '',
		propertyLocation: '',
		propertyAddress: '',
		propertyBarter: false,
		propertyRent: false,
		carBrand: '',
		carModel: '',
		carYear: 0,
		carMileage: 0,
		carFuel: '',
		carTransmission: '',
		carColor: '',
		carTrim: '',
		propertyDesc: '',
		propertyImages: [],
	},
};

export default AddProperty;
