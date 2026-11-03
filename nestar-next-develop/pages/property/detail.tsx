import SellerTrust from '../../libs/components/seller/SellerTrust';
import PriceEstimate from '../../libs/components/car/PriceEstimate';
import ImportCostCard, { ImportCostLine } from '../../libs/components/car/ImportCost';
import { fetchWithTimeout } from '../../libs/utils';
import Lightbox from '../../libs/components/common/Lightbox';
import ReportButton from '../../libs/components/common/ReportButton';
import { toggleCompare } from '../../libs/compare';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import CarOrigin from '../../libs/components/car/CarOrigin';
import { usePrice } from '../../libs/hooks/usePrice';
import Seo from '../../libs/components/common/Seo';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import CarCard from '../../libs/components/car/CarCard';
import { useAppBar } from '../../libs/hooks/useAppBar';
import PageContainer from '../../libs/components/ui/PageContainer';
import Badge from '../../libs/components/ui/Badge';
import { buttonClasses } from '../../libs/components/ui/Button';
import { Spinner } from '../../libs/components/ui/Feedback';
import { cx } from '../../libs/components/ui/classNames';
import { CarRow } from '../../libs/components/car/CarGrid';
import { statusPill, statusTone } from '../../libs/components/ui/styles';

const iconButton =
	'inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 font-sans text-sm font-medium text-text hover:border-ink hover:text-ink [&_svg]:text-xl';
const appBarButton =
	'inline-flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink [&_svg]:text-[22px]';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { Property } from '../../libs/types/property/property';
import moment from 'moment';
import {
	formatCarPlace,
	formatCountry,
	formatEngine,
	formatEnumLabel,
	formatMileage,
	formatPhone,
	formatterStr,
	imageUrl,
} from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { compareVar, userVar } from '../../apollo/store';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { print } from 'graphql';
import { GET_PROPERTIES, GET_PROPERTY } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';
import { CompareArrowsIcon, ChatIcon as ChatBubbleOutlineIcon, FavoriteIcon, FavoriteBorderIcon, EyeIcon as RemoveRedEyeIcon, ShareIcon as ShareOutlinedIcon, PhoneIcon as PhoneOutlinedIcon, CarIcon as DirectionsCarFilledOutlinedIcon, CalendarIcon as CalendarMonthOutlinedIcon, SpeedIcon as SpeedOutlinedIcon, FuelIcon as LocalGasStationOutlinedIcon, SettingsIcon as SettingsOutlinedIcon, CarIcon as DirectionsCarOutlinedIcon, EngineIcon as EngineeringOutlinedIcon } from '../../libs/components/ui/icons';

/**
 * The car is fetched on the server too, so search engines and link previews (Telegram etc.) get the real page
 * (title, price, photos, specs) instead of a spinner. The browser then reloads it with the visitor's login
 * (likes, view counter, seller phone).
 */
const fetchCar = async (id?: string) => {
	// API_INTERNAL_GRAPHQL_URL: server-only address (e.g. http://api:3007/graphql inside docker)
	const url = process.env.API_INTERNAL_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL;
	if (!id || !url) return null;
	try {
		const response = await fetchWithTimeout(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				query: print(GET_PROPERTY),
				variables: { input: id },
			}),
		});
		const { data } = await response.json();
		const car = data?.getProperty ?? null;
		// the phone is not put into the page HTML; the browser loads it
		if (car?.memberData) car.memberData = { ...car.memberData, memberPhone: null };
		return car;
	} catch (err) {
		return null;
	}
};

export const getServerSideProps = async ({ locale, query }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
		carSeo: await fetchCar(query?.id),
	},
});

const PropertyDetail: NextPage = ({ carSeo }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { price, other: otherPrice } = usePrice();
	const user = useReactiveVar(userVar);
	const [propertyId, setPropertyId] = useState<string | null>(null);
	const [property, setProperty] = useState<Property | null>(carSeo ?? null);
	const [slideImage, setSlideImage] = useState<string>(carSeo?.propertyImages?.[0] ?? '');
	const [lightbox, setLightbox] = useState<number | null>(null);
	const compareIds = useReactiveVar(compareVar);
	const [failedImages, setFailedImages] = useState<string[]>([]);
	const mainImageRef = useRef<HTMLImageElement>(null);
	// a server-rendered photo can fail before React attaches onError: check after mount
	useEffect(() => {
		const img = mainImageRef.current;
		if (!img || !slideImage) return;
		const fail = () => setFailedImages((prev) => (prev.includes(slideImage) ? prev : [...prev, slideImage]));
		if (img.complete && img.naturalWidth === 0) return fail();
		img.addEventListener('error', fail);
		return () => img.removeEventListener('error', fail);
	}, [slideImage, property?._id]);
	const [showPhone, setShowPhone] = useState<boolean>(false);
	// phones: the description starts as 3 lines with "read more"
	const [descOpen, setDescOpen] = useState<boolean>(false);
	const swipeStart = useRef<number | null>(null);
	const [destinationProperties, setDestinationProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation<any>(LIKE_TARGET_PROPERTY);

	const {
		loading: getPropertyLoading,
		data: getPropertyData,
		error: getPropertyError,
		refetch: getPropertyRefetch,
	} = useQuery<any>(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: { input: propertyId },
		skip: !propertyId,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getPropertyData) return;
		const data: any = getPropertyData;
		if (data?.getProperty) setProperty(data?.getProperty);
		if (data?.getProperty) setSlideImage(data?.getProperty?.propertyImages[0]);
	}, [getPropertyData]);

	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery<any>(GET_PROPERTIES, {
		fetchPolicy: 'network-only',
		variables: {
			input: {
				page: 1,
				limit: 4,
				sort: 'createdAt',
				direction: Direction.DESC,
				search: {
					brandList: property?.carBrand ? [property?.carBrand] : [],
				},
			},
		},
		skip: !propertyId && !property,
		notifyOnNetworkStatusChange: true,
	});
	// Apollo 4 has no onCompleted: the same work runs whenever a new response arrives
	useEffect(() => {
		if (!getPropertiesData) return;
		const data: any = getPropertiesData;
		if (data?.getProperties?.list) setDestinationProperties(data?.getProperties?.list);
	}, [getPropertiesData]);

	/** LIFECYCLES **/
	// moving from one car to another: show the new server-rendered car right away
	useEffect(() => {
		if (!carSeo) return;
		setProperty(carSeo);
		setSlideImage(carSeo.propertyImages?.[0] ?? '');
	}, [carSeo]);

	useEffect(() => {
		if (router.query.id) {
			setPropertyId(router.query.id as string);
		}
	}, [router]);

	/** HANDLERS **/
	const changeImageHandler = (image: string) => {
		setSlideImage(image);
	};

	const likePropertyHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);

			await likeTargetProperty({
				variables: { input: id },
			});
			await getPropertyRefetch({ input: propertyId });
			await getPropertiesRefetch({
				input: {
					page: 1,
					limit: 4,
					sort: 'createdAt',
					direction: Direction.DESC,
					search: {
						brandList: property?.carBrand ? [property?.carBrand] : [],
					},
				},
			});

			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const shareHandler = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			await sweetTopSmallSuccessAlert(t('Link copied') as string, 900);
		} catch (err: any) {}
	};

	const seo = carSeo ? (
		<Seo
			title={`${carSeo.propertyTitle} — $${formatterStr(carSeo.propertyPrice)}`}
			description={
				carSeo.propertyDesc?.slice(0, 160) ||
				`${carSeo.carYear} ${formatEnumLabel(carSeo.carBrand)} ${carSeo.carModel}, ${formatMileage(carSeo.carMileage)}`
			}
			image={carSeo.propertyImages?.[0] ? imageUrl(carSeo.propertyImages[0]) : undefined}
		/>
	) : null;

	// phones: "← car name   share  like" in the app bar (hooks run before the early returns below)
	const appBarLiked = !!property?.meLiked?.[0]?.myFavorite;
	useAppBar(
		property
			? {
					title: property.propertyTitle,
					actions: (
						<>
							<button className={appBarButton} aria-label={t('Share') as string} onClick={() => shareHandler()}>
								<ShareOutlinedIcon />
							</button>
							<button
								className={cx(appBarButton, appBarLiked && 'text-danger')}
								aria-label={t('Like') as string}
								onClick={() => likePropertyHandler(user, property._id)}
							>
								{appBarLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							</button>
						</>
					),
				}
			: {},
		[property?._id, property?.propertyTitle, appBarLiked, user?._id],
	);

	if (getPropertyLoading && !property) {
		return (
			<div className="flex min-h-[80vh] items-center justify-center">
				{seo}
				<Spinner size={48} />
			</div>
		);
	}

	if (!property) {
		return (
			<div className="pt-[92px] pb-20 font-sans">
				{seo}
				<PageContainer>
					<div className="border-y border-line px-6 py-14 text-center text-[15px] text-muted">{t('Car not found')}</div>
				</PageContainer>
			</div>
		);
	}

	const liked = !!property.meLiked?.[0]?.myFavorite;
	const seller = property.memberData;
	const similarCars = destinationProperties.filter((item) => item._id !== property._id).slice(0, 3);
	// the five facts a buyer scans first; the full table follows below
	const keySpecs = [
		{ label: 'Year', value: property.carYear, icon: <CalendarMonthOutlinedIcon /> },
		{ label: 'Mileage', value: formatMileage(property.carMileage), icon: <SpeedOutlinedIcon /> },
		{ label: 'Fuel', value: formatEnumLabel(property.carFuel, t), icon: <LocalGasStationOutlinedIcon /> },
		{ label: 'Transmission', value: formatEnumLabel(property.carTransmission, t), icon: <SettingsOutlinedIcon /> },
		{ label: 'Body type', value: formatEnumLabel(property.propertyType, t), icon: <DirectionsCarOutlinedIcon /> },
		{ label: 'Engine', value: formatEngine(property.carEngine) || '—', icon: <EngineeringOutlinedIcon /> },
	];
	const images = property.propertyImages ?? [];
	const slideIndex = Math.max(0, images.indexOf(slideImage));
	// phones: swipe the big photo left / right
	const swipeTo = (endX: number) => {
		if (swipeStart.current === null || images.length < 2) return;
		const dx = endX - swipeStart.current;
		swipeStart.current = null;
		if (Math.abs(dx) < 40) return;
		const next = (slideIndex + (dx < 0 ? 1 : -1) + images.length) % images.length;
		setSlideImage(images[next]);
	};
	const details = [
		{ label: 'Country', value: formatCountry(property.carCountry, t) },
		{ label: 'Location', value: formatCarPlace(property, t) },
		{ label: 'Brand', value: formatEnumLabel(property.carBrand, t) },
		{ label: 'Model', value: property.carModel },
		{ label: 'Trim', value: property.carTrim || '—' },
		{ label: 'Year', value: property.carYear },
		{ label: 'Mileage', value: formatMileage(property.carMileage) },
		{ label: 'Engine', value: formatEngine(property.carEngine) || '—' },
		{ label: 'Fuel', value: formatEnumLabel(property.carFuel, t) },
		{ label: 'Transmission', value: formatEnumLabel(property.carTransmission, t) },
		{ label: 'Body type', value: formatEnumLabel(property.propertyType, t) },
		{ label: 'Color', value: property.carColor || '—' },
		{ label: 'VIN', value: property.carVin || '—' },
		{
			label: 'Accidents',
			value: property.carAccidentHistory ? t(`accident_${property.carAccidentHistory}`) : '—',
		},
		{ label: 'Owners', value: property.carOwners ?? '—' },
		{
			label: 'Customs cleared in Uzbekistan',
			value:
				property.carCustomsCleared === undefined || property.carCustomsCleared === null
					? '—'
					: t(property.carCustomsCleared ? 'Yes' : 'No'),
		},
		...(property.carCountry !== 'UZBEKISTAN'
			? [
					{ label: 'Delivery time (days)', value: property.carDeliveryDays ?? '—' },
					{
						label: 'Delivery cost ($)',
						value: property.carDeliveryCost ? `$${formatterStr(property.carDeliveryCost)}` : '—',
					},
				]
			: []),
	];
	// a row with no value is noise for the buyer: only filled fields are listed
	const filledDetails = details.filter(
		(item) => item.value !== '—' && item.value !== '' && item.value !== undefined && item.value !== null,
	);
	const inCompare = compareIds.includes(property._id);
	const isOwner = user?._id === property.memberId;

	const contactHref = user?._id ? `/mypage?category=messages&to=${seller?._id}&propertyId=${property._id}` : '/account/join';
	const panel = 'border-line pt-8 max-md:order-6 [&+&]:mt-8 [&+&]:border-t';
	const panelTitle = 'm-0 mb-4 text-lg font-bold tracking-[-0.01em] text-ink';
	const note = 'mb-[18px] rounded-[10px] bg-[#fef7e0] px-4 py-3 text-sm text-[#7a5200] max-md:order-1';

	return (
		<div className="pt-[72px] pb-[72px] font-sans sm:pb-20 md:pt-[92px]">
			{seo}
			{/* phones / tablets: one column in the order photo, title + price, facts, seller, the rest */}
			<PageContainer className="max-md:flex max-md:flex-col">
				<nav className="mb-[18px] flex items-center gap-2 text-[13px] text-muted max-md:order-0 max-sm:hidden">
					<Link href={'/'} className="text-muted hover:text-primary">
						{t('Home')}
					</Link>
					<span>/</span>
					<Link href={'/property'} className="text-muted hover:text-primary">
						{t('Cars')}
					</Link>
					<span>/</span>
					<em className="overflow-hidden text-ellipsis whitespace-nowrap text-text not-italic">{property.propertyTitle}</em>
				</nav>

				{property.propertyStatus === 'REJECTED' && (
					<div className={note}>
						{t('This listing was rejected by moderation')}
						{property.propertyRejectReason ? `: ${property.propertyRejectReason}` : ''}. {t('Edit it and it goes back to review.')}
					</div>
				)}
				{property.propertyStatus === 'PENDING' && (
					<div className={note}>{t('This listing is waiting for moderation. Only you can see it until it is approved.')}</div>
				)}

				<header className="mb-5 flex flex-col items-start justify-between gap-6 max-md:order-3 md:flex-row">
					<div>
						<h1 className="m-0 mb-2 text-2xl leading-[1.15] font-bold tracking-[-0.025em] text-ink md:text-[30px]">{property.propertyTitle}</h1>
						<div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
							<CarOrigin country={property.carCountry} label={formatCarPlace(property, t)} />
							<span>
								{t('Posted')} {moment(property.createdAt).fromNow()}
							</span>
							<span className="inline-flex items-center gap-1" title={t('Views') as string}>
								<RemoveRedEyeIcon className="text-lg" /> {property.propertyViews}
							</span>
						</div>
						{/* phones / tablets: the price card is far below, so the price is repeated under the title */}
						<div className="mt-2.5 flex items-baseline gap-2.5 md:hidden">
							<strong className="text-[26px] font-extrabold tracking-[-0.02em] text-ink tabular-nums">{price(property)}</strong>
							<span className="text-sm text-muted">≈ {otherPrice(property)}</span>
						</div>
					</div>
					<div className="flex gap-2.5 max-sm:w-full">
						<button
							type="button"
							className={cx(iconButton, 'max-sm:hidden', liked && '[&_svg]:text-danger')}
							onClick={() => likePropertyHandler(user, property._id)}
						>
							{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							<span>{property.propertyLikes}</span>
						</button>
						<button type="button" className={cx(iconButton, 'max-sm:hidden')} onClick={shareHandler}>
							<ShareOutlinedIcon />
							<span>{t('Share')}</span>
						</button>
						<button
							type="button"
							className={cx(iconButton, 'max-sm:flex-1 max-sm:justify-center', inCompare && '[&_svg]:text-danger')}
							onClick={() => {
								if (!toggleCompare(property._id)) sweetMixinErrorAlert(t('You can compare up to 3 cars.') as string).then();
							}}
						>
							<CompareArrowsIcon />
							<span>{inCompare ? t('In comparison') : t('Compare')}</span>
						</button>
					</div>
				</header>

				<div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-7 max-md:contents lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
					<div className="flex min-w-0 flex-col max-md:contents">
						<div className="max-md:order-2 max-md:-mx-4 max-md:mb-4">
							<div
								className="relative aspect-[16/10] touch-pan-y overflow-hidden rounded-[10px] bg-surface max-md:rounded-none"
								onTouchStart={(e) => (swipeStart.current = e.touches[0].clientX)}
								onTouchEnd={(e) => swipeTo(e.changedTouches[0].clientX)}
							>
								{images.length > 1 && (
									<span className="absolute right-3 bottom-3 z-[2] rounded-full bg-ink/60 px-2.5 py-1 text-xs font-semibold text-white sm:hidden">
										{slideIndex + 1}/{images.length}
									</span>
								)}
								{slideImage && !failedImages.includes(slideImage) ? (
									<img
										ref={mainImageRef}
										className="size-full cursor-zoom-in object-cover"
										onClick={() => setLightbox(Math.max(0, property.propertyImages.indexOf(slideImage)))}
										src={imageUrl(slideImage)}
										alt={property.propertyTitle}
										onError={() => setFailedImages((prev) => [...prev, slideImage])}
									/>
								) : (
									<div className="flex size-full flex-col items-center justify-center gap-1.5 text-[13px] text-faint">
										<DirectionsCarFilledOutlinedIcon className="text-[56px] text-line-strong" />
										<span>{t('No photo')}</span>
									</div>
								)}
							</div>
							{lightbox !== null && (
								<Lightbox
									images={property.propertyImages.filter((image) => !failedImages.includes(image))}
									index={lightbox}
									onIndex={setLightbox}
									onClose={() => setLightbox(null)}
									alt={property.propertyTitle}
								/>
							)}
							{/* phones swipe the big photo instead */}
							{property.propertyImages.length > 1 && (
								<div className="mt-3 flex gap-2.5 overflow-x-auto max-md:px-4 max-sm:hidden">
									{property.propertyImages.map((image: string) => (
										<button
											key={image}
											type="button"
											className={cx(
												'h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 bg-surface-alt p-0',
												image === slideImage ? 'border-ink' : 'border-transparent',
											)}
											onClick={() => changeImageHandler(image)}
										>
											<img src={imageUrl(image)} alt={''} className="size-full object-cover" />
										</button>
									))}
								</div>
							)}
						</div>

						{/* key facts: a row on large screens, a card of 3 × 2 tiles with icons on phones */}
						<dl className="m-0 mt-6 grid grid-cols-3 border-y border-line max-md:order-4 max-sm:mt-4 max-sm:overflow-hidden max-sm:rounded-2xl max-sm:border lg:grid-cols-6">
							{keySpecs.map((item, index) => (
								<div
									key={item.label}
									className={cx(
										'px-4 py-3.5 max-sm:grid max-sm:grid-cols-[auto_1fr] max-sm:items-center max-sm:gap-x-2 max-sm:px-2.5 max-sm:py-3',
										index % 3 === 0 ? 'pl-0 max-sm:pl-2.5' : 'border-l border-line',
										index >= 3 && 'max-lg:border-t max-lg:border-line',
										index === 3 && 'lg:border-l lg:border-line lg:pl-4',
									)}
								>
									<span className="row-span-2 hidden text-xl text-muted max-sm:flex">{item.icon}</span>
									<dt className="text-[12.5px] text-muted max-sm:order-2 max-sm:text-[11px]">{t(item.label)}</dt>
									<dd className="m-0 mt-0.5 overflow-hidden text-[15.5px] font-semibold text-ellipsis whitespace-nowrap text-ink tabular-nums max-sm:order-1 max-sm:mt-0 max-sm:text-xs">
										{item.value}
									</dd>
								</div>
							))}
						</dl>

						<section className={cx(panel, 'max-sm:order-5')}>
							<h2 className={panelTitle}>{t('Description')}</h2>
							<p className={cx('m-0 text-[15px] leading-[1.7] whitespace-pre-line text-text', !descOpen && 'max-sm:line-clamp-3')}>
								{property.propertyDesc || t('No description provided.')}
							</p>
							{(property.propertyDesc?.length ?? 0) > 140 && (
								<button
									type="button"
									className="mt-1.5 hidden cursor-pointer border-0 bg-transparent p-0 font-sans text-sm font-semibold text-primary max-sm:inline-block"
									onClick={() => setDescOpen((open) => !open)}
								>
									{descOpen ? t('Show less') : t('Read more')}
								</button>
							)}
						</section>

						<section className={cx(panel, 'max-sm:order-7')}>
							<h2 className={panelTitle}>{t('Specifications')}</h2>
							<dl className="m-0 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
								{filledDetails.map((item) => (
									<div key={item.label} className="flex justify-between gap-3 border-b border-line py-[11px]">
										<dt className="text-sm text-muted">{t(item.label)}</dt>
										<dd className="m-0 text-right text-sm font-semibold text-ink tabular-nums">{item.value}</dd>
									</div>
								))}
							</dl>
						</section>

						<section className={cx(panel, 'max-sm:order-7')}>
							<h2 className={panelTitle}>{t('Location')}</h2>
							{property.carCountry === 'UZBEKISTAN' ? (
								<div className="h-80 overflow-hidden rounded-[10px] bg-surface-alt">
									<iframe
										className="size-full border-0"
										src={`https://www.google.com/maps?q=${encodeURIComponent(formatCarPlace(property, t))}&output=embed`}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										title={'map'}
									></iframe>
								</div>
							) : (
								// abroad a street map tells little: show where the car is and how it gets here
								<div className="grid grid-cols-1 border-y border-line sm:grid-cols-3">
									{[
										{ label: t('The car is in'), value: formatCarPlace(property, t) },
										{
											label: t('Delivery to Uzbekistan'),
											value: `${property.carDeliveryDays ? `~${property.carDeliveryDays} ${t('days')}` : t('Ask the seller')}${
												property.carDeliveryCost ? ` · $${formatterStr(property.carDeliveryCost)}` : ''
											}`,
										},
										{
											label: t('Customs cleared in Uzbekistan'),
											value:
												property.carCustomsCleared === undefined || property.carCustomsCleared === null
													? t('Not specified')
													: t(property.carCustomsCleared ? 'Yes' : 'No'),
										},
									].map((item, index) => (
										<div
											key={index}
											className={cx(
												'flex flex-col gap-1 py-3 sm:px-4 sm:py-3.5',
												index === 0 ? 'sm:pl-0' : 'max-sm:border-t sm:border-l border-line',
											)}
										>
											<span className="text-[12.5px] text-muted">{item.label}</span>
											<strong className="text-[15px] text-ink">{item.value}</strong>
										</div>
									))}
								</div>
							)}
						</section>

						<div className="max-md:order-6 max-sm:order-7">
							<ImportCostCard propertyId={property._id} propertyPrice={property.propertyPrice} />
						</div>
					</div>

					<aside className="flex flex-col gap-5 max-md:order-5 max-md:mt-6 max-sm:order-6 md:sticky md:top-24">
						<div className="rounded-[10px] border border-line bg-white p-6">
							{/* phones show the price under the title */}
							<div className="max-sm:hidden">
								<span className="text-[13px] text-muted">{t('Price')}</span>
								<strong className="mt-1 mb-3 block text-[32px] font-extrabold tracking-[-0.025em] text-ink tabular-nums">{price(property)}</strong>
								<span className="-mt-2 mb-3 block text-sm text-muted tabular-nums">≈ {otherPrice(property)}</span>
							</div>
							<PriceEstimate propertyId={property._id} />
							<ImportCostLine propertyId={property._id} propertyPrice={property.propertyPrice} />
							<div className="flex flex-wrap gap-1.5 border-b border-line pb-[18px]">
								<span className={cx(statusPill, statusTone[property.propertyStatus] ?? statusTone.ACTIVE)}>
									{t(property.propertyStatus === 'SOLD' ? 'Sold' : property.propertyStatus === 'PENDING' ? 'Under review' : 'For sale')}
								</span>
								{property.carCustomsCleared && <Badge>{t('Customs cleared')}</Badge>}
								{property.carAccidentHistory === 'NONE' && <Badge>{t('No accidents')}</Badge>}
								{property.propertyBarter && <Badge>{t('Barter')}</Badge>}
								{property.propertyNegotiable && <Badge>{t('Negotiable')}</Badge>}
							</div>

							<div className="mt-[18px] mb-2 flex items-center gap-3">
								<img
									src={seller?.memberImage ? imageUrl(seller.memberImage) : '/img/profile/defaultUser.svg'}
									alt={seller?.memberNick}
									className="size-12 rounded-full bg-surface-alt object-cover"
								/>
								<div>
									<Link href={`/member?memberId=${seller?._id}`}>
										<strong className="block text-[15px] text-ink hover:text-primary">{seller?.memberFullName || seller?.memberNick}</strong>
									</Link>
									<span className="text-[13px] text-muted">{t(seller?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</span>
								</div>
							</div>
							<SellerTrust member={seller} />

							{showPhone ? (
								<a className={buttonClasses({ block: true, className: 'mt-2.5' })} href={`tel:${formatPhone(seller?.memberPhone)}`}>
									<PhoneOutlinedIcon /> {formatPhone(seller?.memberPhone)}
								</a>
							) : (
								<button type="button" className={buttonClasses({ block: true, className: 'mt-2.5' })} onClick={() => setShowPhone(true)}>
									<PhoneOutlinedIcon /> {t('Show phone number')}
								</button>
							)}
							{!isOwner && (
								<Link href={contactHref} className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })}>
									<ChatBubbleOutlineIcon /> {t('Write to seller')}
								</Link>
							)}
							<Link href={`/member?memberId=${seller?._id}`} className={buttonClasses({ variant: 'outline', block: true, className: 'mt-2.5' })}>
								{t("View seller's cars")}
							</Link>
							{!isOwner && <ReportButton propertyId={property._id} />}
						</div>

						<div className="px-1">
							<h3 className="m-0 mb-3 text-sm font-semibold text-ink">{t('Safety tips')}</h3>
							<ul className="m-0 pl-[18px]">
								{['Inspect the car and its documents in person.', 'Check the VIN and service history.', 'Never send prepayment before seeing the car.'].map(
									(tip) => (
										<li key={tip} className="mb-1.5 list-disc text-[13.5px] leading-normal text-muted">
											{t(tip)}
										</li>
									),
								)}
							</ul>
						</div>
					</aside>
				</div>

				{/* phones: contact buttons always within reach (the class also hides the tab bar) */}
				{!isOwner && (
					<div className="ma-contact-bar fixed inset-x-0 bottom-0 z-[1100] grid grid-cols-2 gap-2.5 border-t border-line bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(15,23,42,0.08)] sm:hidden">
						<a className={buttonClasses({ className: 'w-full' })} href={`tel:${formatPhone(seller?.memberPhone)}`}>
							<PhoneOutlinedIcon className="text-lg" /> {t('Call')}
						</a>
						<Link href={contactHref} className={buttonClasses({ variant: 'outline', className: 'w-full' })}>
							<ChatBubbleOutlineIcon className="text-lg" /> {t('Write')}
						</Link>
					</div>
				)}

				{similarCars.length > 0 && (
					<section className="mt-16 border-t border-line pt-10 max-md:order-7 max-sm:order-8">
						<div className="mb-6 flex items-baseline justify-between gap-3">
							<h2 className="m-0 text-[22px] leading-[1.2] font-bold tracking-[-0.02em] text-ink">{t('Similar Cars')}</h2>
							<Link
								className="text-sm font-semibold whitespace-nowrap text-primary sm:hidden"
								href={{
									pathname: '/property',
									query: { input: JSON.stringify({ page: 1, limit: 9, search: { brandList: [property.carBrand] } }) },
								}}
							>
								{t('See all')}
							</Link>
						</div>
						<CarRow>
							{similarCars.map((car: Property) => (
								<CarCard property={car} key={car._id} onLike={(id) => likePropertyHandler(user, id)} layout="tile" />
							))}
						</CarRow>
					</section>
				)}
			</PageContainer>
		</div>
	);
};

export default withLayoutFull(PropertyDetail);
