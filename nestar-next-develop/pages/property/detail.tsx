import SellerTrust from '../../libs/components/common/SellerTrust';
import PriceEstimate from '../../libs/components/property/PriceEstimate';
import { fetchWithTimeout } from '../../libs/utils';
import Lightbox from '../../libs/components/common/Lightbox';
import ReportButton from '../../libs/components/common/ReportButton';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { toggleCompare } from '../../libs/compare';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { usePrice } from '../../libs/hooks/usePrice';
import Seo from '../../libs/components/common/Seo';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import CarCard from '../../libs/components/common/CarCard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Property } from '../../libs/types/property/property';
import moment from 'moment';
import {
	formatCarPlace,
	formatCountry,
	formatEngine,
	formatEnumLabel,
	formatMileage,
	formatPhone,
	formatterStr, imageUrl } from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { compareVar, userVar } from '../../apollo/store';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_PROPERTIES, GET_PROPERTY } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';

/** car basics fetched on the server so search engines and link previews (Telegram etc.) see real title, price and photo */
const fetchCarSeo = async (id?: string) => {
	// API_INTERNAL_GRAPHQL_URL: server-only address (e.g. http://api:3007/graphql inside docker)
	const url = process.env.API_INTERNAL_GRAPHQL_URL || process.env.REACT_APP_API_GRAPHQL_URL;
	if (!id || !url) return null;
	try {
		const response = await fetchWithTimeout(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				query:
					'query($id:String!){getProperty(propertyId:$id){propertyTitle propertyPrice carYear carMileage carBrand carModel propertyImages propertyDesc}}',
				variables: { id },
			}),
		});
		const { data } = await response.json();
		return data?.getProperty ?? null;
	} catch (err) {
		return null;
	}
};

export const getServerSideProps = async ({ locale, query }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
		carSeo: await fetchCarSeo(query?.id),
	},
});

const PropertyDetail: NextPage = ({ carSeo }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { price, other: otherPrice } = usePrice();
	const user = useReactiveVar(userVar);
	const [propertyId, setPropertyId] = useState<string | null>(null);
	const [property, setProperty] = useState<Property | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [lightbox, setLightbox] = useState<number | null>(null);
	const compareIds = useReactiveVar(compareVar);
	const [failedImages, setFailedImages] = useState<string[]>([]);
	const [showPhone, setShowPhone] = useState<boolean>(false);
	const [destinationProperties, setDestinationProperties] = useState<Property[]>([]);

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const {
		loading: getPropertyLoading,
		data: getPropertyData,
		error: getPropertyError,
		refetch: getPropertyRefetch,
	} = useQuery(GET_PROPERTY, {
		fetchPolicy: 'network-only',
		variables: { input: propertyId },
		skip: !propertyId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getProperty) setProperty(data?.getProperty);
			if (data?.getProperty) setSlideImage(data?.getProperty?.propertyImages[0]);
		},
	});

	const {
		loading: getPropertiesLoading,
		data: getPropertiesData,
		error: getPropertiesError,
		refetch: getPropertiesRefetch,
	} = useQuery(GET_PROPERTIES, {
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
		onCompleted: (data: T) => {
			if (data?.getProperties?.list) setDestinationProperties(data?.getProperties?.list);
		},
	});

	/** LIFECYCLES **/
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
		} catch (err: any) {
		}
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

	if (getPropertyLoading && !property) {
		return (
			<div className={'ma-page ma-detail ma-detail--loading'}>
				{seo}
				<CircularProgress size={'3rem'} />
			</div>
		);
	}

	if (!property) {
		return (
			<div className={'ma-page ma-detail'}>
				{seo}
				<div className={'ma-container'}>
					<div className={'ma-empty'}>{t('Car not found')}</div>
				</div>
			</div>
		);
	}

	const liked = !!property.meLiked?.[0]?.myFavorite;
	const seller = property.memberData;
	const similarCars = destinationProperties.filter((item) => item._id !== property._id).slice(0, 3);
	const specTiles = [
		{ icon: <CalendarMonthOutlinedIcon />, label: 'Year', value: property.carYear },
		{ icon: <SpeedOutlinedIcon />, label: 'Mileage', value: formatMileage(property.carMileage) },
		{ icon: <LocalGasStationOutlinedIcon />, label: 'Fuel', value: formatEnumLabel(property.carFuel, t) },
		{ icon: <SettingsOutlinedIcon />, label: 'Transmission', value: formatEnumLabel(property.carTransmission, t) },
		{ icon: <DirectionsCarOutlinedIcon />, label: 'Body type', value: formatEnumLabel(property.propertyType, t) },
	];
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
			value: property.carCustomsCleared === undefined || property.carCustomsCleared === null ? '—' : t(property.carCustomsCleared ? 'Yes' : 'No'),
		},
		...(property.carCountry !== 'UZBEKISTAN'
			? [
					{ label: 'Delivery time (days)', value: property.carDeliveryDays ?? '—' },
					{ label: 'Delivery cost ($)', value: property.carDeliveryCost ? `$${formatterStr(property.carDeliveryCost)}` : '—' },
			  ]
			: []),
	];
	// a row with no value is noise for the buyer: only filled fields are listed
	const filledDetails = details.filter((item) => item.value !== '—' && item.value !== '' && item.value !== undefined && item.value !== null);
	const inCompare = compareIds.includes(property._id);
	const isOwner = user?._id === property.memberId;

	return (
		<div className={'ma-page ma-detail'}>
			{seo}
			<div className={'ma-container'}>
				<nav className={'ma-breadcrumb'}>
					<Link href={'/'}>{t('Home')}</Link>
					<span>/</span>
					<Link href={'/property'}>{t('Cars')}</Link>
					<span>/</span>
					<em>{property.propertyTitle}</em>
				</nav>

				{property.propertyStatus === 'REJECTED' && (
					<div className={'ma-note ma-note--warn'}>
						{t('This listing was rejected by moderation')}
						{property.propertyRejectReason ? `: ${property.propertyRejectReason}` : ''}. {t('Edit it and it goes back to review.')}
					</div>
				)}
				{property.propertyStatus === 'PENDING' && (
					<div className={'ma-note ma-note--warn'}>
						{t('This listing is waiting for moderation. Only you can see it until it is approved.')}
					</div>
				)}

				<header className={'ma-detail__head'}>
					<div>
						<h1>{property.propertyTitle}</h1>
						<div className={'ma-detail__meta'}>
							<span>{formatCountry(property.carCountry, t)}</span>
							<span>{formatCarPlace(property, t)}</span>
							<span>
								{t('Posted')} {moment(property.createdAt).fromNow()}
							</span>
							<span title={t('Views') as string}>
								<RemoveRedEyeIcon /> {property.propertyViews}
							</span>
						</div>
						{/* phones: the price card is far below, so the price is repeated under the title */}
						<div className={'ma-detail__mprice'}>
							<strong>{price(property)}</strong>
							<span>≈ {otherPrice(property)}</span>
						</div>
					</div>
					<div className={'ma-detail__actions'}>
						<button
							className={`ma-icon-btn ${liked ? 'is-liked' : ''}`}
							onClick={() => likePropertyHandler(user, property._id)}
						>
							{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
							<span>{property.propertyLikes}</span>
						</button>
						<button className={'ma-icon-btn'} onClick={shareHandler}>
							<ShareOutlinedIcon />
							<span>{t('Share')}</span>
						</button>
						<button
							className={`ma-icon-btn ${inCompare ? 'is-liked' : ''}`}
							onClick={() => {
								if (!toggleCompare(property._id)) sweetMixinErrorAlert(t('You can compare up to 3 cars.') as string).then();
							}}
						>
							<CompareArrowsIcon />
							<span>{inCompare ? t('In comparison') : t('Compare')}</span>
						</button>
					</div>
				</header>

				<div className={'ma-detail__layout'}>
					<div className={'ma-detail__main'}>
						<div className={'ma-gallery'}>
							<div className={'ma-gallery__main'}>
								{slideImage && !failedImages.includes(slideImage) ? (
									<img
										className={'ma-gallery__zoom'}
										onClick={() => setLightbox(Math.max(0, property.propertyImages.indexOf(slideImage)))}
										src={imageUrl(slideImage)}
										alt={property.propertyTitle}
										onError={() => setFailedImages((prev) => [...prev, slideImage])}
									/>
								) : (
									<div className={'ma-car-card__placeholder'}>
										<DirectionsCarFilledOutlinedIcon />
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
							{property.propertyImages.length > 1 && (
								<div className={'ma-gallery__thumbs'}>
									{property.propertyImages.map((image: string) => (
										<button
											key={image}
											className={image === slideImage ? 'is-active' : ''}
											onClick={() => changeImageHandler(image)}
										>
											<img src={imageUrl(image)} alt={''} />
										</button>
									))}
								</div>
							)}
						</div>

						<div className={'ma-spec-tiles'}>
							{specTiles.map((item) => (
								<div className={'ma-spec-tile'} key={item.label}>
									{item.icon}
									<span>{t(item.label)}</span>
									<strong>{item.value}</strong>
								</div>
							))}
						</div>

						<section className={'ma-panel'}>
							<h2>{t('Description')}</h2>
							<p className={'ma-panel__text'}>{property.propertyDesc || t('No description provided.')}</p>
						</section>

						<section className={'ma-panel'}>
							<h2>{t('Specifications')}</h2>
							<dl className={'ma-details'}>
								{filledDetails.map((item) => (
									<div key={item.label}>
										<dt>{t(item.label)}</dt>
										<dd>{item.value}</dd>
									</div>
								))}
							</dl>
						</section>

						<section className={'ma-panel'}>
							<h2>{t('Location')}</h2>
							{property.carCountry === 'UZBEKISTAN' ? (
								<div className={'ma-map'}>
									<iframe
										src={`https://www.google.com/maps?q=${encodeURIComponent(formatCarPlace(property, t))}&output=embed`}
										loading="lazy"
										referrerPolicy="no-referrer-when-downgrade"
										title={'map'}
									></iframe>
								</div>
							) : (
								// abroad a street map tells little: show where the car is and how it gets here
								<div className={'ma-abroad'}>
									<div>
										<span>{t('The car is in')}</span>
										<strong>{formatCarPlace(property, t)}</strong>
									</div>
									<div>
										<span>{t('Delivery to Uzbekistan')}</span>
										<strong>
											{property.carDeliveryDays ? `~${property.carDeliveryDays} ${t('days')}` : t('Ask the seller')}
											{property.carDeliveryCost ? ` · $${formatterStr(property.carDeliveryCost)}` : ''}
										</strong>
									</div>
									<div>
										<span>{t('Customs cleared in Uzbekistan')}</span>
										<strong>
											{property.carCustomsCleared === undefined || property.carCustomsCleared === null
												? t('Not specified')
												: t(property.carCustomsCleared ? 'Yes' : 'No')}
										</strong>
									</div>
								</div>
							)}
						</section>

					</div>

					<aside className={'ma-detail__side'}>
						<div className={'ma-panel ma-price-card'}>
							<span className={'ma-price-card__label'}>{t('Price')}</span>
							<strong className={'ma-price-card__price'}>{price(property)}</strong>
							<span className={'ma-price-card__other'}>≈ {otherPrice(property)}</span>
							<PriceEstimate propertyId={property._id} />
							<div className={'ma-price-card__badges'}>
								<span className={`ma-status ma-status--${property.propertyStatus.toLowerCase()}`}>
									{t(property.propertyStatus === 'SOLD' ? 'Sold' : property.propertyStatus === 'PENDING' ? 'Under review' : 'For sale')}
								</span>
								{property.carCustomsCleared && <span className={'ma-badge ma-badge--primary'}>{t('Customs cleared')}</span>}
								{property.carAccidentHistory === 'NONE' && (
									<span className={'ma-badge ma-badge--primary'}>{t('No accidents')}</span>
								)}
								{property.propertyBarter && <span className={'ma-badge ma-badge--primary'}>{t('Barter')}</span>}
								{property.propertyNegotiable && (
									<span className={'ma-badge ma-badge--primary'}>{t('Negotiable')}</span>
								)}
							</div>

							<div className={'ma-seller'}>
								<img
									src={
										seller?.memberImage ? imageUrl(seller.memberImage) : '/img/profile/defaultUser.svg'
									}
									alt={seller?.memberNick}
								/>
								<div>
									<Link href={`/member?memberId=${seller?._id}`}>
										<strong>{seller?.memberFullName || seller?.memberNick}</strong>
									</Link>
									<span>{t(seller?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</span>
								</div>
							</div>
							<SellerTrust member={seller} />

							{showPhone ? (
								<a className={'ma-btn ma-btn--primary ma-btn--block'} href={`tel:${formatPhone(seller?.memberPhone)}`}>
									<PhoneOutlinedIcon /> {formatPhone(seller?.memberPhone)}
								</a>
							) : (
								<button className={'ma-btn ma-btn--primary ma-btn--block'} onClick={() => setShowPhone(true)}>
									<PhoneOutlinedIcon /> {t('Show phone number')}
								</button>
							)}
							{!isOwner && (
								<Link
									href={
										user?._id
											? `/mypage?category=messages&to=${seller?._id}&propertyId=${property._id}`
											: '/account/join'
									}
								>
									<span className={'ma-btn ma-btn--outline ma-btn--block'}>
										<ChatBubbleOutlineIcon /> {t('Write to seller')}
									</span>
								</Link>
							)}
							<Link href={`/member?memberId=${seller?._id}`}>
								<span className={'ma-btn ma-btn--outline ma-btn--block'}>{t("View seller's cars")}</span>
							</Link>
							{!isOwner && <ReportButton propertyId={property._id} />}
						</div>

						<div className={'ma-panel ma-tips'}>
							<h3>
								<ShieldOutlinedIcon /> {t('Safety tips')}
							</h3>
							<ul>
								<li>{t('Inspect the car and its documents in person.')}</li>
								<li>{t('Check the VIN and service history.')}</li>
								<li>{t('Never send prepayment before seeing the car.')}</li>
							</ul>
						</div>
					</aside>
				</div>

				{/* phones: contact buttons always within reach */}
				{!isOwner && (
					<div className={'ma-contact-bar'}>
						<a className={'ma-btn ma-btn--primary'} href={`tel:${formatPhone(seller?.memberPhone)}`}>
							<PhoneOutlinedIcon /> {t('Call')}
						</a>
						<Link
							href={user?._id ? `/mypage?category=messages&to=${seller?._id}&propertyId=${property._id}` : '/account/join'}
						>
							<span className={'ma-btn ma-btn--outline'}>
								<ChatBubbleOutlineIcon /> {t('Write')}
							</span>
						</Link>
					</div>
				)}

				{similarCars.length > 0 && (
					<section className={'ma-similar'}>
						<h2 className={'ma-title'}>{t('Similar Cars')}</h2>
						<div className={'ma-grid ma-grid--3'}>
							{similarCars.map((car: Property) => (
								<CarCard property={car} key={car._id} onLike={(id) => likePropertyHandler(user, id)} />
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
};


export default withLayoutFull(PropertyDetail);
