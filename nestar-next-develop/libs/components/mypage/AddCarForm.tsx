import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import Dialog from '../ui/Dialog';
import Badge from '../ui/Badge';
import { switchInput } from '../ui/Switch';
import { cx } from '../ui/classNames';
import CarCard from '../car/CarCard';
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
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { usdRateVar, userVar } from '../../../apollo/store';
import { CREATE_PROPERTY, UPDATE_PROPERTY } from '../../../apollo/user/mutation';
import { uploadImages } from '../../upload';
import {
	buildPayload,
	DRAFT_KEY,
	emptyCar,
	formKeys,
	MAX_PHOTOS,
	MIN_PHOTOS,
	missingFields,
	STEPS,
	suggestTitle,
} from './addCarForm.logic';
import { GET_CAR_MODELS, GET_PROPERTY } from '../../../apollo/user/query';
import { CloudUploadIcon as CloudUploadOutlinedIcon, CloseIcon, StarIcon as StarOutlineIcon } from '../ui/icons';
import { accountPanel, accountPanelHead, codeRow, field, fieldHint, formError, formSection, formSubtitle, linkButton } from '../ui/styles';

/** the form keeps two columns on phones (short fields: year, mileage, fuel...) */
const phoneGrid2 = 'grid grid-cols-2 gap-x-3 sm:gap-x-4';
const phoneGrid3 = 'grid grid-cols-2 gap-x-3 sm:grid-cols-3 sm:gap-x-4';
/** on phones the buttons stay above the tab bar while the form scrolls */
const stickyActions = cx(
	'mt-2 flex flex-wrap justify-end gap-3 border-t border-line pt-5',
	'max-sm:sticky max-sm:bottom-[calc(62px+env(safe-area-inset-bottom))] max-sm:z-[5] max-sm:mt-4 max-sm:gap-2.5 max-sm:bg-white max-sm:py-3',
	'max-sm:[&>button]:min-h-12 max-sm:[&>button]:flex-1 max-sm:[&:has(>button:nth-of-type(3))>button:last-child]:order-1 max-sm:[&:has(>button:nth-of-type(3))>button:last-child]:basis-full',
);
const thumbButton =
	'absolute top-1.5 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-ink/70 text-white [&_svg]:text-base';
import { buttonClasses } from '../ui/Button';

const AddCarForm = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const user = useReactiveVar(userVar);
	const usdRate = useReactiveVar(usdRateVar);
	const editId = router.query.propertyId as string | undefined;
	const [car, setCar] = useState<any>(emptyCar);
	const [step, setStep] = useState<number>(0);
	const stepsRef = useRef<HTMLOListElement>(null);
	const firstStep = useRef(true);
	// a new step starts at its first field, not where the buttons were (on phones that is mid-page)
	useEffect(() => {
		if (firstStep.current) {
			firstStep.current = false;
			return;
		}
		const top = stepsRef.current?.getBoundingClientRect().top;
		if (top !== undefined) window.scrollTo({ top: window.scrollY + top - 96, behavior: 'smooth' });
	}, [step]);
	// missing fields are pointed out only after the seller presses Next/Publish, not before typing anything
	const [tried, setTried] = useState<boolean>(false);
	const [previewOpen, setPreviewOpen] = useState<boolean>(false);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [draftRestored, setDraftRestored] = useState<boolean>(false);
	const isUzbekistan = car.carCountry === CarCountry.UZBEKISTAN;
	const abroad = !!car.carCountry && !isUzbekistan;

	/** APOLLO REQUESTS **/
	const [createProperty, { loading: creating }] = useMutation<any>(CREATE_PROPERTY);
	const [updateProperty, { loading: updating }] = useMutation<any>(UPDATE_PROPERTY);
	const { data: propertyData } = useQuery<any>(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: { input: editId },
		skip: !editId,
	});
	const { data: modelsData } = useQuery<any>(GET_CAR_MODELS, { skip: !car.carBrand, variables: { brand: car.carBrand } });

	/** LIFECYCLES **/
	// editing: load the car; new listing: restore the unfinished draft
	useEffect(() => {
		const existing = propertyData?.getProperty;
		if (existing) {
			const loaded: any = {};
			formKeys.forEach((key) => (loaded[key] = existing[key] ?? emptyCar[key]));
			// a so'm listing is edited in so'm, exactly as the seller typed it
			if (existing.propertyPriceCurrency === 'UZS' && existing.propertyPriceOriginal)
				loaded.propertyPrice = existing.propertyPriceOriginal;
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

	const addPhotos = async () => {
		const files = Array.from(inputRef.current?.files ?? []);
		if (!files.length) return;
		if (files.length > MAX_PHOTOS - car.propertyImages.length) {
			await sweetMixinErrorAlert(t('You can upload up to 10 photos.') as string);
			return;
		}
		setUploading(true);
		try {
			const uploaded = await uploadImages(files, 'property');
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
	/** reorder photos: drag & drop on desktop, arrow buttons on phones */
	const moveImage = (from: number, to: number) => {
		if (to < 0 || to >= car.propertyImages.length || from === to) return;
		const images = [...car.propertyImages];
		const [moved] = images.splice(from, 1);
		images.splice(to, 0, moved);
		set('propertyImages', images);
	};

	const suggestedTitle = suggestTitle(car);
	/** what is still missing on each step, shown next to the disabled button */
	const missing = missingFields(car);
	const stepValid = missing.map((fields) => fields.length === 0);

	const submitHandler = async () => {
		try {
			if (editId) {
				const wasRejected = propertyData?.getProperty?.propertyStatus === 'REJECTED';
				await updateProperty({ variables: { input: { _id: editId, ...buildPayload(car) } } });
				// a fixed rejected listing goes back to moderation
				await sweetMixinSuccessAlert(
					(wasRejected ? t('Sent for review again. We will check the changes soon.') : t('This car has been updated successfully.')) as string,
				);
			} else {
				const { data } = await createProperty({ variables: { input: buildPayload(car) } });
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

	const priceCurrency: 'USD' | 'UZS' = car.propertyPriceCurrency === 'UZS' ? 'UZS' : 'USD';
	const usdValue = priceCurrency === 'UZS' ? Math.round((car.propertyPrice || 0) / usdRate) : car.propertyPrice || 0;
	// what buyers will see on the card
	const previewCar: any = {
		...buildPayload(car),
		_id: editId ?? 'preview',
		propertyPrice: usdValue,
		propertyPriceOriginal: priceCurrency === 'UZS' ? car.propertyPrice : undefined,
		propertyImages: car.propertyImages,
		propertyLikes: 0,
		propertyViews: 0,
	};

	return (
		<div id="add-property-page" className={accountPanel}>
			<div className={accountPanelHead}>
				<div>
					<h1>{editId ? t('Edit Car') : t('Add New Car')}</h1>
					<p>{t('Fill in the details buyers care about most. Fields marked * are required.')}</p>
				</div>
			</div>

			{/* buyers call sellers: an account made with an email confirms a phone before listing */}
			{!editId && user._id && !(user.memberPhone && user.memberPhoneVerified) && (
				<div className="mb-[18px] rounded-[10px] bg-[#fef7e0] px-4 py-3 text-sm text-[#7a5200]" role={'status'}>
					{t('Confirm your phone number in your profile before listing a car.')}{' '}
					<Link href={{ pathname: '/mypage', query: { category: 'myProfile' } }} className={linkButton}>
						{t('Add phone')}
					</Link>
				</div>
			)}

			{draftRestored && (
				<div className="mb-[18px] rounded-[10px] bg-[#eff6ff] px-4 py-3 text-sm text-ink">
					{t('We restored your unfinished listing.')}{' '}
					<button className={linkButton} onClick={discardDraft}>
						{t('Start over')}
					</button>
				</div>
			)}

			<ol className="m-0 mb-[22px] flex list-none gap-2 p-0" ref={stepsRef}>
				{STEPS.map((label, index) => (
					<li key={label} className="flex-1">
						<button
							className={cx(
								'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 font-sans text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60',
								'max-sm:flex-col max-sm:gap-1 max-sm:px-1.5 max-sm:py-2.5 max-sm:text-center max-sm:text-xs',
								index === step ? 'border-primary text-primary' : 'border-line text-muted',
							)}
							disabled={index > step && !stepValid.slice(0, index).every(Boolean)}
							onClick={() => setStep(index)}
						>
							<span
								className={cx(
									'inline-flex size-[26px] items-center justify-center rounded-full text-[13px]',
									index === step ? 'bg-primary text-white' : index < step ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#f1f3f6]',
								)}
							>
								{index + 1}
							</span>
							{t(label)}
						</button>
					</li>
				))}
			</ol>

			{step === 0 && (
				<section className={formSection}>
					<div className={phoneGrid2}>
						<label className={field}>
							<span>{t('Brand *')}</span>
							{select('carBrand', Object.values(CarBrand))}
						</label>
						<label className={field}>
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
						<label className={field}>
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
						<label className={field}>
							<span>{t('Body type *')}</span>
							{select('propertyType', Object.values(PropertyType))}
						</label>
						<label className={field}>
							<span>{t('Mileage (km) *')}</span>
							<input
								type="number"
								min={0}
								placeholder={'35000'}
								value={car.carMileage ?? ''}
								onChange={({ target: { value } }) => set('carMileage', parseInt(value) || 0)}
							/>
						</label>
						<label className={field}>
							<span>{t('Trim')}</span>
							<input
								type="text"
								placeholder={'AWD, M-Sport, LTZ'}
								value={car.carTrim ?? ''}
								onChange={({ target: { value } }) => set('carTrim', value)}
							/>
						</label>
					</div>
					<div className={phoneGrid3}>
						<label className={field}>
							<span>{t('Fuel *')}</span>
							{select('carFuel', Object.values(CarFuel))}
						</label>
						<label className={field}>
							<span>{t('Transmission *')}</span>
							{select('carTransmission', Object.values(CarTransmission))}
						</label>
						<label className={field}>
							<span>{t('Engine (L)')}</span>
							<input
								type="number"
								step={0.1}
								placeholder={'2.0'}
								value={car.carEngine ?? ''}
								onChange={({ target: { value } }) => set('carEngine', number(value, true))}
							/>
						</label>
						<label className={field}>
							<span>{t('Color')}</span>
							<input type="text" placeholder={t('e.g. White') as string} value={car.carColor ?? ''} onChange={({ target: { value } }) => set('carColor', value)} />
						</label>
						<label className={`${field} col-span-2`}>
							<span>{t('VIN (17 characters)')}</span>
							<input
								type="text"
								maxLength={17}
								placeholder={'KNDPM3AC1M7123456'}
								value={car.carVin ?? ''}
								onChange={({ target: { value } }) => set('carVin', value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
							/>
							<em className={fieldHint}>{t('Listings with a VIN get more trust from buyers.')}</em>
						</label>
					</div>
				</section>
			)}

			{step === 1 && (
				<section className={formSection}>
					<div className={phoneGrid2}>
						<label className={field}>
							<span>{t('Country *')}</span>
							{select('carCountry', Object.values(CarCountry), (item) => formatCountry(item, t))}
						</label>
						{isUzbekistan && (
							<label className={field}>
								<span>{t('City *')}</span>
								{select('propertyLocation', Object.values(PropertyLocation))}
							</label>
						)}
						<label className={field}>
							<span>{isUzbekistan ? t('District / street') : t('City abroad')} *</span>
							<input
								type="text"
								placeholder={isUzbekistan ? 'Chilonzor 9' : 'Incheon, Frankfurt, Dubai...'}
								value={car.propertyAddress}
								onChange={({ target: { value } }) => set('propertyAddress', value)}
							/>
						</label>
					</div>

					<h3 className={formSubtitle}>{t('History')}</h3>
					<div className={phoneGrid3}>
						<label className={field}>
							<span>{t('Accidents')}</span>
							{select('carAccidentHistory', Object.values(CarAccidentHistory), (item) => t(`accident_${item}`))}
						</label>
						<label className={field}>
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
						<label className={field}>
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
							<h3 className={formSubtitle}>{t('Delivery to Uzbekistan')}</h3>
							<div className={phoneGrid2}>
								<label className={field}>
									<span>{t('Delivery time (days)')}</span>
									<input
										type="number"
										min={0}
										placeholder={'30'}
										value={car.carDeliveryDays ?? ''}
										onChange={({ target: { value } }) => set('carDeliveryDays', number(value))}
									/>
								</label>
								<label className={field}>
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

					<label className={field}>
						<span>{t('Description')} *</span>
						<textarea
							maxLength={500}
							placeholder={t('Condition, service history, extras, reason for selling...') as string}
							value={car.propertyDesc}
							onChange={({ target: { value } }) => set('propertyDesc', value)}
						></textarea>
						<em className={fieldHint}>{(car.propertyDesc ?? '').length}/500</em>
					</label>
					<div className="flex gap-6 max-sm:flex-col max-sm:gap-3">
						<label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-text">
							<input type="checkbox" role="switch" className={switchInput} checked={!!car.propertyBarter} onChange={({ target: { checked } }) => set('propertyBarter', checked)} />
							<span>{t('Open to barter')}</span>
						</label>
					</div>
				</section>
			)}

			{step === 2 && (
				<section className={formSection}>
					<h3 className={formSubtitle}>
						{t('Photos')} * <small>({car.propertyImages.length}/{MAX_PHOTOS})</small>
					</h3>
					{car.propertyImages.length > 0 && car.propertyImages.length < MIN_PHOTOS && (
						<p className={formError}>{t('Add at least {{count}} more photo(s).', { count: MIN_PHOTOS - car.propertyImages.length })}</p>
					)}
					{car.propertyImages.length > 1 && <p className={fieldHint}>{t('Drag photos to change the order. The first one is the cover.')}</p>}
					{car.propertyImages.length < MAX_PHOTOS && (
						<div
							className={cx(
								'flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-2 border-dashed border-[#cbd5e1] bg-surface p-8 text-center transition-colors hover:border-primary hover:bg-[#eff6ff] [&_svg]:text-[40px] [&_svg]:text-primary',
								uploading && 'cursor-progress opacity-60',
							)}
							onClick={() => !uploading && inputRef.current?.click()}>
							<CloudUploadOutlinedIcon />
							<strong className="text-[15px] text-ink">{uploading ? t('Uploading...') : t('Click to upload photos')}</strong>
							<span className="text-[13px] text-muted">{t('At least 3 photos (front, back, interior), up to 10. JPG, PNG or WEBP.')}</span>
							<input
								ref={inputRef}
								type="file"
								hidden
								onChange={addPhotos}
								multiple
								accept="image/jpg, image/jpeg, image/png, image/webp"
							/>
						</div>
					)}
					{car.propertyImages.length > 0 && (
						<div className="mt-3.5 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
							{car.propertyImages.map((image: string, index: number) => (
								<div
									className={cx('relative h-[90px] cursor-grab overflow-hidden rounded-[10px] bg-[#f1f3f6]', dragIndex === index && 'opacity-40')}
									key={image}
									draggable
									onDragStart={() => setDragIndex(index)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => {
										if (dragIndex !== null) moveImage(dragIndex, index);
										setDragIndex(null);
									}}
									onDragEnd={() => setDragIndex(null)}
								>
									<img src={imageUrl(image)} alt={''} className="size-full object-cover" />
									{index === 0 ? (
										<Badge className="absolute bottom-1.5 left-1.5 h-5 text-[11px]">{t('Cover')}</Badge>
									) : (
										<button className={cx(thumbButton, 'left-1.5')} title={t('Make cover') as string} onClick={() => makeCover(image)}>
											<StarOutlineIcon />
										</button>
									)}
									<button className={cx(thumbButton, 'right-1.5')} title={t('Delete') as string} onClick={() => removeImage(image)}>
										<CloseIcon />
									</button>
									<div className="absolute right-1.5 bottom-1.5 flex gap-1 [&>button]:size-[26px] [&>button]:cursor-pointer [&>button]:rounded-full [&>button]:border-0 [&>button]:bg-ink/70 [&>button]:text-base [&>button]:leading-none [&>button]:text-white [&>button:disabled]:cursor-default [&>button:disabled]:opacity-30">
										<button aria-label={t('Move left') as string} disabled={index === 0} onClick={() => moveImage(index, index - 1)}>
											‹
										</button>
										<button
											aria-label={t('Move right') as string}
											disabled={index === car.propertyImages.length - 1}
											onClick={() => moveImage(index, index + 1)}
										>
											›
										</button>
									</div>
								</div>
							))}
						</div>
					)}

					<h3 className={formSubtitle}>{t('Price')}</h3>
					<div className={phoneGrid2}>
						<label className={field}>
							<span>{t('Price')} *</span>
							<div className={codeRow}>
								<input
									type="number"
									min={0}
									placeholder={priceCurrency === 'USD' ? '34500' : '438000000'}
									value={car.propertyPrice || ''}
									onChange={({ target: { value } }) => set('propertyPrice', parseInt(value) || 0)}
								/>
								<select
									value={priceCurrency}
									onChange={({ target: { value } }) => set('propertyPriceCurrency', value)}
									aria-label={t('Currency') as string}
								>
									<option value={'USD'}>USD</option>
									<option value={'UZS'}>{t("so'm")}</option>
								</select>
							</div>
							{priceCurrency === 'UZS' && car.propertyPrice > 0 && (
								<em className={fieldHint}>
									≈ ${usdValue.toLocaleString('en-US')} · {t('buyers see exactly the amount you typed')}
								</em>
							)}
						</label>
						<label className={field}>
							<span>{t('Title')}</span>
							<input
								type="text"
								maxLength={100}
								placeholder={suggestedTitle || '2023 Kia Sorento Signature'}
								value={car.propertyTitle}
								onChange={({ target: { value } }) => set('propertyTitle', value)}
							/>
							<em className={fieldHint}>{t('Leave empty to use the year, brand and model.')}</em>
						</label>
					</div>
					<div className="flex gap-6 max-sm:flex-col max-sm:gap-3">
						<label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-text">
							<input
								type="checkbox"
								role="switch"
								className={switchInput}
								checked={!!car.propertyNegotiable}
								onChange={({ target: { checked } }) => set('propertyNegotiable', checked)}
							/>
							<span>{t('Price is negotiable')}</span>
						</label>
					</div>
				</section>
			)}

			<div className={stickyActions}>
				{/* inside the button bar: on phones the bar stays on screen, so what is missing does too */}
				{tried && !stepValid[step] && missing[step].length > 0 && (
					<p className="m-0 basis-full text-right text-[13px] text-[#d93025] max-sm:text-left">
						{t('Please fill in')}: {missing[step].map((label) => t(label)).join(', ')}
					</p>
				)}
				{step > 0 ? (
					<button className={buttonClasses({ variant: 'outline' })} onClick={() => setStep(step - 1)}>
						← {t('Back')}
					</button>
				) : (
					<button className={buttonClasses({ variant: 'outline' })} onClick={() => router.push('/mypage?category=myProperties')}>
						{t('Cancel')}
					</button>
				)}
				{step === STEPS.length - 1 && (
					<button className={buttonClasses({ variant: 'outline' })} disabled={!stepValid[2]} onClick={() => setPreviewOpen(true)}>
						{t('Preview')}
					</button>
				)}
				{step < STEPS.length - 1 ? (
					<button
						className={buttonClasses()}
						onClick={() => {
							if (!stepValid[step]) return setTried(true);
							setTried(false);
							setStep(step + 1);
						}}
					>
						{t('Next')} →
					</button>
				) : (
					<button
						className={buttonClasses()}
						disabled={creating || updating || uploading}
						onClick={() => (stepValid.every(Boolean) ? submitHandler() : setTried(true))}
					>
						{editId ? t('Save changes') : t('Publish listing')}
					</button>
				)}
			</div>
			{step === STEPS.length - 1 && !editId && !user?.memberTrusted && (
				<p className={`${fieldHint} mt-2.5 text-right`}>
					{t('Your first listing is checked by our team, usually within 2 hours. After that you publish instantly.')}
				</p>
			)}

			<Dialog
				open={previewOpen}
				onClose={() => setPreviewOpen(false)}
				size="sm"
				title={t('This is how buyers will see your car')}
				actions={
					<>
								<button className={buttonClasses({ variant: 'outline' })} onClick={() => setPreviewOpen(false)}>
								{t('Edit')}
							</button>
							<button
								className={buttonClasses()}
								disabled={creating || updating}
								onClick={() => {
									setPreviewOpen(false);
									submitHandler();
								}}
							>
								{editId ? t('Save changes') : t('Publish listing')}
							</button>
					</>
				}
			>
				<div className="pointer-events-none" aria-hidden>
					<CarCard property={previewCar} />
				</div>
			</Dialog>
		</div>
	);
};

export default AddCarForm;
