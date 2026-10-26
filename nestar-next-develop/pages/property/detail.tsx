import React, { ChangeEvent, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import Seo from '../../libs/components/common/Seo';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { NextPage } from 'next';
import Review from '../../libs/components/property/Review';
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
	formatterStr,
} from '../../libs/utils';
import { REACT_APP_API_URL } from '../../libs/config';
import { userVar } from '../../apollo/store';
import { CommentInput, CommentsInquiry } from '../../libs/types/comment/comment.input';
import { Comment } from '../../libs/types/comment/comment';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Pagination as MuiPagination } from '@mui/material';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GET_COMMENTS, GET_PROPERTIES, GET_PROPERTY } from '../../apollo/user/query';
import { T } from '../../libs/types/common';
import { Direction, Message } from '../../libs/enums/common.enum';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { CREATE_COMMENT, LIKE_TARGET_PROPERTY } from '../../apollo/user/mutation';

/** car basics fetched on the server so search engines and link previews (Telegram etc.) see real title, price and photo */
const fetchCarSeo = async (id?: string) => {
	if (!id || !process.env.REACT_APP_API_GRAPHQL_URL) return null;
	try {
		const response = await fetch(process.env.REACT_APP_API_GRAPHQL_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				query:
					'query($id:String!){getProperty(propertyId:$id){propertyTitle propertyPrice carYear carMileage carBrand carModel propertyImages propertyDesc}}',
				variables: { id },
			}),
			signal: AbortSignal.timeout(3000),
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

const PropertyDetail: NextPage = ({ initialComment, carSeo, ...props }: any) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [propertyId, setPropertyId] = useState<string | null>(null);
	const [property, setProperty] = useState<Property | null>(null);
	const [slideImage, setSlideImage] = useState<string>('');
	const [failedImages, setFailedImages] = useState<string[]>([]);
	const [showPhone, setShowPhone] = useState<boolean>(false);
	const [destinationProperties, setDestinationProperties] = useState<Property[]>([]);
	const [commentInquiry, setCommentInquiry] = useState<CommentsInquiry>(initialComment);
	const [propertyComments, setPropertyComments] = useState<Comment[]>([]);
	const [commentTotal, setCommentTotal] = useState<number>(0);
	const [insertCommentData, setInsertCommentData] = useState<CommentInput>({
		commentGroup: CommentGroup.PROPERTY,
		commentContent: '',
		commentRefId: '',
	});

	/** APOLLO REQUESTS **/
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);
	const [createComment] = useMutation(CREATE_COMMENT);

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

	const {
		loading: getCommentsLoading,
		data: getCommentsData,
		error: getCommentsError,
		refetch: getCommentsRefetch,
	} = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		variables: { input: initialComment },
		skip: !commentInquiry.search.commentRefId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			if (data?.getComments?.list) setPropertyComments(data?.getComments?.list);
			setCommentTotal(data?.getComments?.metaCounter[0]?.total ?? 0);
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.query.id) {
			setPropertyId(router.query.id as string);
			setCommentInquiry({
				...commentInquiry,
				search: {
					commentRefId: router.query.id as string,
				},
			});
			setInsertCommentData({
				...insertCommentData,
				commentRefId: router.query.id as string,
			});
		}
	}, [router]);

	useEffect(() => {
		if (commentInquiry.search.commentRefId) {
			getCommentsRefetch({ input: commentInquiry });
		}
	}, [commentInquiry]);

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

	const commentPaginationChangeHandler = async (event: ChangeEvent<unknown>, value: number) => {
		commentInquiry.page = value;
		setCommentInquiry({ ...commentInquiry });
	};

	const createCommentHandler = async () => {
		try {
			if (!user._id) throw new Error(Message.NOT_AUTHENTICATED);
			await createComment({ variables: { input: insertCommentData } });

			setInsertCommentData({ ...insertCommentData, commentContent: '' });

			await getCommentsRefetch({ input: commentInquiry });
		} catch (err: any) {
			await sweetErrorHandling(err);
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
			image={carSeo.propertyImages?.[0] ? `${REACT_APP_API_URL}/${carSeo.propertyImages[0]}` : undefined}
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
	];

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

				<header className={'ma-detail__head'}>
					<div>
						<h1>{property.propertyTitle}</h1>
						<div className={'ma-detail__meta'}>
							<span>{formatCountry(property.carCountry, t)}</span>
							<span>{formatCarPlace(property, t)}</span>
							<span>
								{t('Posted')} {moment(property.createdAt).fromNow()}
							</span>
							<span>
								<RemoveRedEyeIcon /> {property.propertyViews}
							</span>
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
					</div>
				</header>

				<div className={'ma-detail__layout'}>
					<div className={'ma-detail__main'}>
						<div className={'ma-gallery'}>
							<div className={'ma-gallery__main'}>
								{slideImage && !failedImages.includes(slideImage) ? (
									<img
										src={`${REACT_APP_API_URL}/${slideImage}`}
										alt={property.propertyTitle}
										onError={() => setFailedImages((prev) => [...prev, slideImage])}
									/>
								) : (
									<div className={'ma-car-card__placeholder'}>
										<DirectionsCarFilledOutlinedIcon />
									</div>
								)}
							</div>
							{property.propertyImages.length > 1 && (
								<div className={'ma-gallery__thumbs'}>
									{property.propertyImages.map((image: string) => (
										<button
											key={image}
											className={image === slideImage ? 'is-active' : ''}
											onClick={() => changeImageHandler(image)}
										>
											<img src={`${REACT_APP_API_URL}/${image}`} alt={''} />
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
								{details.map((item) => (
									<div key={item.label}>
										<dt>{t(item.label)}</dt>
										<dd>{item.value}</dd>
									</div>
								))}
							</dl>
						</section>

						<section className={'ma-panel'}>
							<h2>{t('Location')}</h2>
							<div className={'ma-map'}>
								<iframe
									src={`https://www.google.com/maps?q=${encodeURIComponent(formatCarPlace(property, t))}&output=embed`}
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
									title={'map'}
								></iframe>
							</div>
						</section>

						<section className={'ma-panel'}>
							<h2>
								{t('Comments')} <small>({commentTotal})</small>
							</h2>
							<div className={'ma-comment-form'}>
								<textarea
									placeholder={t('Ask the seller or share your opinion...') as string}
									value={insertCommentData.commentContent}
									onChange={({ target: { value } }: any) =>
										setInsertCommentData({ ...insertCommentData, commentContent: value })
									}
								></textarea>
								<button
									className={'ma-btn ma-btn--primary'}
									disabled={insertCommentData.commentContent === '' || !user?._id}
									onClick={createCommentHandler}
								>
									{user?._id ? t('Post comment') : t('Login to comment')}
								</button>
							</div>
							{propertyComments.map((comment: Comment) => (
								<Review comment={comment} key={comment?._id} />
							))}
							{commentTotal > commentInquiry.limit && (
								<div className={'ma-pagination'}>
									<MuiPagination
										page={commentInquiry.page}
										count={Math.ceil(commentTotal / commentInquiry.limit)}
										onChange={commentPaginationChangeHandler}
										shape="rounded"
									/>
								</div>
							)}
						</section>
					</div>

					<aside className={'ma-detail__side'}>
						<div className={'ma-panel ma-price-card'}>
							<span className={'ma-price-card__label'}>{t('Price')}</span>
							<strong className={'ma-price-card__price'}>${formatterStr(property.propertyPrice)}</strong>
							<div className={'ma-price-card__badges'}>
								<span className={`ma-status ma-status--${property.propertyStatus.toLowerCase()}`}>
									{t(property.propertyStatus === 'SOLD' ? 'Sold' : 'For sale')}
								</span>
								{property.propertyBarter && <span className={'ma-badge ma-badge--primary'}>{t('Barter')}</span>}
								{property.propertyNegotiable && (
									<span className={'ma-badge ma-badge--primary'}>{t('Negotiable')}</span>
								)}
							</div>

							<div className={'ma-seller'}>
								<img
									src={
										seller?.memberImage ? `${REACT_APP_API_URL}/${seller.memberImage}` : '/img/profile/defaultUser.svg'
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

							{showPhone ? (
								<a className={'ma-btn ma-btn--primary ma-btn--block'} href={`tel:${formatPhone(seller?.memberPhone)}`}>
									<PhoneOutlinedIcon /> {formatPhone(seller?.memberPhone)}
								</a>
							) : (
								<button className={'ma-btn ma-btn--primary ma-btn--block'} onClick={() => setShowPhone(true)}>
									<PhoneOutlinedIcon /> {t('Show phone number')}
								</button>
							)}
							<Link href={`/member?memberId=${seller?._id}`}>
								<span className={'ma-btn ma-btn--outline ma-btn--block'}>{t("View seller's cars")}</span>
							</Link>
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

PropertyDetail.defaultProps = {
	initialComment: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {
			commentRefId: '',
		},
	},
};

export default withLayoutFull(PropertyDetail);
