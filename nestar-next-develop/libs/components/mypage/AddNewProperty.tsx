import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloseIcon from '@mui/icons-material/Close';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import {
	CarAccidentHistory,
	CarBrand,
	CarCountry,
	CarFuel,
	CarTransmission,
	PropertyLocation,
	PropertyType,
} from '../../enums/property.enum';
import { propertyYears } from '../../config';
import { formatCountry, formatEnumLabel, imageUrl } from '../../utils';
import { PropertyInput } from '../../types/property/property.input';
import { getJwtToken } from '../../auth';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { usdRateVar, userVar } from '../../../apollo/store';
import { CREATE_PROPERTY, UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { GET_CAR_MODELS, GET_PROPERTY } from '../../../apollo/user/query';

const MAX_PHOTOS = 10;
const DRAFT_KEY = 'carDraft';
const STEPS = ['Car', 'History & location', 'Photos & price'];

const emptyCar: any = {
	propertyTitle: '',
	propertyPrice: 0,
	propertyType: '',
	carCountry: '',
	propertyLocation: '',
	propertyAddress: '',
	propertyBarter: false,
	propertyNegotiable: false,
	carBrand: '',
	carModel: '',
	carYear: 0,
	carMileage: 0,
	carFuel: '',
	carTransmission: '',
	carColor: '',
	carTrim: '',
	carEngine: undefined,
	carVin: '',
	carAccidentHistory: '',
	carOwners: undefined,
	carCustomsCleared: undefined,
	carDeliveryDays: undefined,
	carDeliveryCost: undefined,
	propertyDesc: '',
	propertyImages: [],
};

// fields the form edits; everything else returned by getProperty is ignored
const formKeys = Object.keys(emptyCar);

const AddProperty = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const user = useReactiveVar(userVar);
	const usdRate = useReactiveVar(usdRateVar);
	const editId = router.query.propertyId as string | undefined;
	const [car, setCar] = useState<any>(emptyCar);
	const [step, setStep] = useState<number>(0);
	const [priceCurrency, setPriceCurrency] = useState<'USD' | 'UZS'>('USD');
	const [uploading, setUploading] = useState<boolean>(false);
	const [draftRestored, setDraftRestored] = useState<boolean>(false);
	const isUzbekistan = car.carCountry === CarCountry.UZBEKISTAN;
	const abroad = !!car.carCountry && !isUzbekistan;

	/** APOLLO REQUESTS **/
	const [createProperty, { loading: creating }] = useMutation(CREATE_PROPERTY);
	const [updateProperty, { loading: updating }] = useMutation(UPDATE_PROPERTY);
	const { data: propertyData } = useQuery(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: { input: editId },
		skip: !editId,
	});
	const { data: modelsData } = useQuery(GET_CAR_MODELS, { skip: !car.carBrand, variables: { brand: car.carBrand } });

	/** LIFECYCLES **/
	// editing: load the car; new listing: restore the unfinished draft
	useEffect(() => {
		const existing = propertyData?.getProperty;
		if (existing) {
			const loaded: any = {};
			formKeys.forEach((key) => (loaded[key] = existing[key] ?? emptyCar[key]));
			setCar(loaded);
		}
	}, [propertyData]);

	useEffect(() => {
		if (editId || !router.isReady) return;
		try {
			const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
			if (draft && typeof draft === 'object') {
				setCar({ ...emptyCar, ...draft });
				setDraftRestored(true);
			}
		} catch (err) {
			localStorage.removeItem(DRAFT_KEY);
		}
	}, [router.isReady, editId]);

	// autosave the new listing while it is being filled in
	useEffect(() => {
		if (editId) return;
		const timer = setTimeout(() => {
			const touched = JSON.stringify(car) !== JSON.stringify(emptyCar);
			if (touched) localStorage.setItem(DRAFT_KEY, JSON.stringify(car));
		}, 500);
		return () => clearTimeout(timer);
	}, [car, editId]);

	// only members can list cars; admins moderate
	useEffect(() => {
		if (user?._id && user.memberType === 'ADMIN') router.push('/mypage').then();
	}, [user?._id]);

	/** HANDLERS **/
	const set = (key: string, value: any) => setCar((prev: any) => ({ ...prev, [key]: value }));
	const number = (value: string, float = false) => (value === '' ? undefined : float ? parseFloat(value) : parseInt(value));

	const uploadImages = async () => {
		const files = Array.from(inputRef.current?.files ?? []);
		if (!files.length) return;
		const room = MAX_PHOTOS - car.propertyImages.length;
		if (files.length > room) {
			await sweetMixinErrorAlert(t('You can upload up to 10 photos.') as string);
			return;
		}
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImagesUploader($files: [Upload!]!, $target: String!) { imagesUploader(files: $files, target: $target) }`,
					variables: { files: files.map(() => null), target: 'property' },
				}),
			);
			formData.append('map', JSON.stringify(Object.fromEntries(files.map((_, i) => [String(i), [`variables.files.${i}`]]))));
			files.forEach((file, i) => formData.append(String(i), file));

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${getJwtToken()}`,
				},
			});
			const uploaded: string[] = response.data?.data?.imagesUploader ?? [];
			if (response.data?.errors?.length) throw new Error(response.data.errors[0].message);
			setCar((prev: any) => ({ ...prev, propertyImages: [...prev.propertyImages, ...uploaded] }));
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = '';
		}
	};

	const removeImage = (image: string) =>
		set(
			'propertyImages',
			car.propertyImages.filter((item: string) => item !== image),
		);
	const makeCover = (image: string) =>
		set('propertyImages', [image, ...car.propertyImages.filter((item: string) => item !== image)]);

	const suggestedTitle = [car.carYear || '', formatEnumLabel(car.carBrand), car.carModel, car.carTrim].filter(Boolean).join(' ');

	/** per-step required fields */
	const stepValid = [
		!!car.carBrand && !!car.carModel?.trim() && !!car.carYear && !!car.propertyType && car.carMileage >= 0 && !!car.carFuel && !!car.carTransmission && (!car.carVin || /^[A-HJ-NPR-Z0-9]{17}$/i.test(car.carVin)),
		!!car.carCountry && (!isUzbekistan || !!car.propertyLocation) && !!car.propertyAddress?.trim() && (car.propertyDesc?.trim().length ?? 0) >= 5,
		car.propertyPrice > 0 && car.propertyImages.length > 0 && (car.propertyTitle || suggestedTitle).trim().length > 0,
	];

	/** drops empty optional fields and the city for cars located abroad */
	const buildPayload = (): PropertyInput => {
		const payload: any = { ...car, propertyTitle: (car.propertyTitle || suggestedTitle).trim() };
		Object.keys(payload).forEach((key) => {
			if (payload[key] === '' || payload[key] === undefined || payload[key] === null || Number.isNaN(payload[key]))
				delete payload[key];
		});
		if (payload.carCountry !== CarCountry.UZBEKISTAN) delete payload.propertyLocation;
		else {
			delete payload.carDeliveryDays;
			delete payload.carDeliveryCost;
		}
		return payload;
	};

	const submitHandler = async () => {
		try {
			if (editId) {
				await updateProperty({ variables: { input: { _id: editId, ...buildPayload() } } });
				await sweetMixinSuccessAlert(t('This car has been updated successfully.') as string);
			} else {
				const { data } = await createProperty({ variables: { input: buildPayload() } });
				localStorage.removeItem(DRAFT_KEY);
				const pending = data?.createProperty?.propertyStatus === 'PENDING';
				await sweetMixinSuccessAlert(
					(pending
						? t('Sent for review. Your first listing appears after a quick check by our team.')
						: t('This car has been listed successfully.')) as string,
					pending ? 4000 : 2000,
				);
			}
			await router.push({ pathname: '/mypage', query: { category: 'myProperties' } });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const discardDraft = () => {
		localStorage.removeItem(DRAFT_KEY);
		setCar(emptyCar);
		setDraftRestored(false);
		setStep(0);
	};

	const select = (key: string, options: string[], format: (item: string) => string = (item) => formatEnumLabel(item, t)) => (
		<select value={car[key] || ''} onChange={({ target: { value } }) => set(key, value)}>
			<option value={''} disabled>
				{t('Select')}
			</option>
			{options.map((item) => (
				<option value={item} key={item}>
					{format(item)}
				</option>
			))}
		</select>
	);

	const priceInput = priceCurrency === 'USD' ? car.propertyPrice || '' : car.propertyPrice ? Math.round(car.propertyPrice * usdRate) : '';

	return (
		<div id="add-property-page" className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{editId ? t('Edit Car') : t('Add New Car')}</h1>
					<p>{t('Fill in the details buyers care about most. Fields marked * are required.')}</p>
				</div>
			</div>

			{draftRestored && (
				<div className={'ma-note'}>
					{t('We restored your unfinished listing.')}{' '}
					<button className={'ma-link-btn'} onClick={discardDraft}>
						{t('Start over')}
					</button>
				</div>
			)}

			<ol className={'ma-steps'}>
				{STEPS.map((label, index) => (
					<li key={label} className={index === step ? 'is-active' : index < step ? 'is-done' : ''}>
						<button disabled={index > step && !stepValid.slice(0, index).every(Boolean)} onClick={() => setStep(index)}>
							<span>{index + 1}</span>
							{t(label)}
						</button>
					</li>
				))}
			</ol>

			{step === 0 && (
				<section className={'ma-form-section'}>
					<div className={'ma-form-grid'}>
						<label className={'ma-input'}>
							<span>{t('Brand *')}</span>
							{select('carBrand', Object.values(CarBrand))}
						</label>
						<label className={'ma-input'}>
							<span>{t('Model *')}</span>
							<input
								type="text"
								list={'ma-form-models'}
								placeholder={'Sorento'}
								value={car.carModel ?? ''}
								onChange={({ target: { value } }) => set('carModel', value)}
							/>
							<datalist id={'ma-form-models'}>
								{(modelsData?.getCarModels ?? []).map((model: string) => (
									<option value={model} key={model} />
								))}
							</datalist>
						</label>
						<label className={'ma-input'}>
							<span>{t('Year *')}</span>
							<select value={car.carYear || ''} onChange={({ target: { value } }) => set('carYear', parseInt(value))}>
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
							{select('propertyType', Object.values(PropertyType))}
						</label>
						<label className={'ma-input'}>
							<span>{t('Mileage (km) *')}</span>
							<input
								type="number"
								min={0}
								placeholder={'35000'}
								value={car.carMileage ?? ''}
								onChange={({ target: { value } }) => set('carMileage', parseInt(value) || 0)}
							/>
						</label>
						<label className={'ma-input'}>
							<span>{t('Trim')}</span>
							<input
								type="text"
								placeholder={'AWD, M-Sport, LTZ'}
								value={car.carTrim ?? ''}
								onChange={({ target: { value } }) => set('carTrim', value)}
							/>
						</label>
					</div>
					<div className={'ma-form-grid ma-form-grid--3'}>
						<label className={'ma-input'}>
							<span>{t('Fuel *')}</span>
							{select('carFuel', Object.values(CarFuel))}
						</label>
						<label className={'ma-input'}>
							<span>{t('Transmission *')}</span>
							{select('carTransmission', Object.values(CarTransmission))}
						</label>
						<label className={'ma-input'}>
							<span>{t('Engine (L)')}</span>
							<input
								type="number"
								step={0.1}
								placeholder={'2.0'}
								value={car.carEngine ?? ''}
								onChange={({ target: { value } }) => set('carEngine', number(value, true))}
							/>
						</label>
						<label className={'ma-input'}>
							<span>{t('Color')}</span>
							<input type="text" placeholder={'White'} value={car.carColor ?? ''} onChange={({ target: { value } }) => set('carColor', value)} />
						</label>
						<label className={'ma-input ma-input--wide'}>
							<span>{t('VIN (17 characters)')}</span>
							<input
								type="text"
								maxLength={17}
								placeholder={'KNDPM3AC1M7123456'}
								value={car.carVin ?? ''}
								onChange={({ target: { value } }) => set('carVin', value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
							/>
							<em className={'ma-input__hint'}>{t('Listings with a VIN get more trust from buyers.')}</em>
						</label>
					</div>
				</section>
			)}

			{step === 1 && (
				<section className={'ma-form-section'}>
					<div className={'ma-form-grid'}>
						<label className={'ma-input'}>
							<span>{t('Country *')}</span>
							{select('carCountry', Object.values(CarCountry), (item) => formatCountry(item, t))}
						</label>
						{isUzbekistan && (
							<label className={'ma-input'}>
								<span>{t('City *')}</span>
								{select('propertyLocation', Object.values(PropertyLocation))}
							</label>
						)}
						<label className={'ma-input'}>
							<span>{isUzbekistan ? t('District / street') : t('City abroad')} *</span>
							<input
								type="text"
								placeholder={isUzbekistan ? 'Chilonzor 9' : 'Incheon, Frankfurt, Dubai...'}
								value={car.propertyAddress}
								onChange={({ target: { value } }) => set('propertyAddress', value)}
							/>
						</label>
					</div>

					<h3 className={'ma-form-subtitle'}>{t('History')}</h3>
					<div className={'ma-form-grid ma-form-grid--3'}>
						<label className={'ma-input'}>
							<span>{t('Accidents')}</span>
							{select('carAccidentHistory', Object.values(CarAccidentHistory), (item) => t(`accident_${item}`))}
						</label>
						<label className={'ma-input'}>
							<span>{t('Owners')}</span>
							<input
								type="number"
								min={0}
								max={20}
								placeholder={'1'}
								value={car.carOwners ?? ''}
								onChange={({ target: { value } }) => set('carOwners', number(value))}
							/>
						</label>
						<label className={'ma-input'}>
							<span>{t('Customs cleared in Uzbekistan')}</span>
							<select
								value={car.carCustomsCleared === undefined ? '' : String(car.carCustomsCleared)}
								onChange={({ target: { value } }) => set('carCustomsCleared', value === '' ? undefined : value === 'true')}
							>
								<option value={''}>{t('Not specified')}</option>
								<option value={'true'}>{t('Yes')}</option>
								<option value={'false'}>{t('No')}</option>
							</select>
						</label>
					</div>

					{abroad && (
						<>
							<h3 className={'ma-form-subtitle'}>{t('Delivery to Uzbekistan')}</h3>
							<div className={'ma-form-grid'}>
								<label className={'ma-input'}>
									<span>{t('Delivery time (days)')}</span>
									<input
										type="number"
										min={0}
										placeholder={'30'}
										value={car.carDeliveryDays ?? ''}
										onChange={({ target: { value } }) => set('carDeliveryDays', number(value))}
									/>
								</label>
								<label className={'ma-input'}>
									<span>{t('Delivery cost ($)')}</span>
									<input
										type="number"
										min={0}
										placeholder={'1800'}
										value={car.carDeliveryCost ?? ''}
										onChange={({ target: { value } }) => set('carDeliveryCost', number(value))}
									/>
								</label>
							</div>
						</>
					)}

					<label className={'ma-input'}>
						<span>{t('Description')} *</span>
						<textarea
							maxLength={500}
							placeholder={t('Condition, service history, extras, reason for selling...') as string}
							value={car.propertyDesc}
							onChange={({ target: { value } }) => set('propertyDesc', value)}
						></textarea>
						<em className={'ma-input__hint'}>{(car.propertyDesc ?? '').length}/500</em>
					</label>
					<div className={'ma-switch-row'}>
						<label className={'ma-switch'}>
							<input type="checkbox" checked={!!car.propertyBarter} onChange={({ target: { checked } }) => set('propertyBarter', checked)} />
							<span>{t('Open to barter')}</span>
						</label>
					</div>
				</section>
			)}

			{step === 2 && (
				<section className={'ma-form-section'}>
					<h3 className={'ma-form-subtitle'}>
						{t('Photos')} * <small>({car.propertyImages.length}/{MAX_PHOTOS})</small>
					</h3>
					{car.propertyImages.length < MAX_PHOTOS && (
						<div className={`ma-upload ${uploading ? 'is-busy' : ''}`} onClick={() => !uploading && inputRef.current?.click()}>
							<CloudUploadOutlinedIcon />
							<strong>{uploading ? t('Uploading...') : t('Click to upload photos')}</strong>
							<span>{t('Up to 10 photos, JPG, PNG or WEBP. Photos are compressed automatically.')}</span>
							<input
								ref={inputRef}
								type="file"
								hidden
								onChange={uploadImages}
								multiple
								accept="image/jpg, image/jpeg, image/png, image/webp"
							/>
						</div>
					)}
					{car.propertyImages.length > 0 && (
						<div className={'ma-upload__gallery'}>
							{car.propertyImages.map((image: string, index: number) => (
								<div className={'ma-upload__thumb'} key={image}>
									<img src={imageUrl(image)} alt={''} />
									{index === 0 ? (
										<span className={'ma-badge ma-badge--primary'}>{t('Cover')}</span>
									) : (
										<button className={'ma-upload__cover'} title={t('Make cover') as string} onClick={() => makeCover(image)}>
											<StarOutlineIcon />
										</button>
									)}
									<button className={'ma-upload__remove'} title={t('Delete') as string} onClick={() => removeImage(image)}>
										<CloseIcon />
									</button>
								</div>
							))}
						</div>
					)}

					<h3 className={'ma-form-subtitle'}>{t('Price')}</h3>
					<div className={'ma-form-grid'}>
						<label className={'ma-input'}>
							<span>{t('Price')} *</span>
							<div className={'ma-code-row'}>
								<input
									type="number"
									min={0}
									placeholder={priceCurrency === 'USD' ? '34500' : '438000000'}
									value={priceInput}
									onChange={({ target: { value } }) => {
										const amount = parseInt(value) || 0;
										// stored in USD; so'm is converted with today's official rate
										set('propertyPrice', priceCurrency === 'USD' ? amount : Math.round(amount / usdRate));
									}}
								/>
								<select value={priceCurrency} onChange={({ target: { value } }) => setPriceCurrency(value as any)}>
									<option value={'USD'}>USD</option>
									<option value={'UZS'}>{t("so'm")}</option>
								</select>
							</div>
							{priceCurrency === 'UZS' && car.propertyPrice > 0 && (
								<em className={'ma-input__hint'}>≈ ${car.propertyPrice.toLocaleString('en-US')}</em>
							)}
						</label>
						<label className={'ma-input'}>
							<span>{t('Title')}</span>
							<input
								type="text"
								maxLength={100}
								placeholder={suggestedTitle || '2023 Kia Sorento Signature'}
								value={car.propertyTitle}
								onChange={({ target: { value } }) => set('propertyTitle', value)}
							/>
							<em className={'ma-input__hint'}>{t('Leave empty to use the year, brand and model.')}</em>
						</label>
					</div>
					<div className={'ma-switch-row'}>
						<label className={'ma-switch'}>
							<input
								type="checkbox"
								checked={!!car.propertyNegotiable}
								onChange={({ target: { checked } }) => set('propertyNegotiable', checked)}
							/>
							<span>{t('Price is negotiable')}</span>
						</label>
					</div>
				</section>
			)}

			<div className={'ma-form-actions'}>
				{step > 0 ? (
					<button className={'ma-btn ma-btn--outline'} onClick={() => setStep(step - 1)}>
						← {t('Back')}
					</button>
				) : (
					<button className={'ma-btn ma-btn--outline'} onClick={() => router.push('/mypage?category=myProperties')}>
						{t('Cancel')}
					</button>
				)}
				{step < STEPS.length - 1 ? (
					<button className={'ma-btn ma-btn--primary'} disabled={!stepValid[step]} onClick={() => setStep(step + 1)}>
						{t('Next')} →
					</button>
				) : (
					<button
						className={'ma-btn ma-btn--primary'}
						disabled={!stepValid.every(Boolean) || creating || updating || uploading}
						onClick={submitHandler}
					>
						{editId ? t('Save changes') : t('Publish listing')}
					</button>
				)}
			</div>
		</div>
	);
};

export default AddProperty;
