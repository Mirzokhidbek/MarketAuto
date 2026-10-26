import { useReactiveVar } from '@apollo/client';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { compareVar } from '../../../apollo/store';
import { toggleCompare } from '../../compare';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { usePrice } from '../../hooks/usePrice';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import { Property } from '../../types/property/property';
import { formatCountry, formatEnumLabel, formatMileage, formatterStr, imageUrl } from '../../utils';

interface CarCardProps {
	property: Property;
	onLike?: (id: string) => void;
}

const CarCard = ({ property, onLike }: CarCardProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const [imageFailed, setImageFailed] = useState(false);
	const imageRef = useRef<HTMLImageElement>(null);
	// a server-rendered <img> can fail before React attaches onError: check once after mount
	useEffect(() => {
		const img = imageRef.current;
		if (img && img.complete && img.naturalWidth === 0) setImageFailed(true);
	}, [property._id]);
	const image = property.propertyImages?.[0];
	const liked = !!property.meLiked?.[0]?.myFavorite;
	const place =
		property.carCountry === 'UZBEKISTAN' ? formatEnumLabel(property.propertyLocation, t) : property.propertyAddress;
	const specs = [
		property.carEngine ? `${Number(property.carEngine).toFixed(1)} ${formatEnumLabel(property.carFuel, t)}` : formatEnumLabel(property.carFuel, t),
		formatMileage(property.carMileage),
		formatEnumLabel(property.carTransmission, t),
		place,
	].filter(Boolean);

	const compareIds = useReactiveVar(compareVar);
	const inCompare = compareIds.includes(property._id);
	const openDetail = () => router.push({ pathname: '/property/detail', query: { id: property._id } });

	return (
		<div className={'ma-car-card'}>
			<div className={'ma-car-card__media'} onClick={openDetail}>
				{image && !imageFailed ? (
					<img ref={imageRef} src={imageUrl(image)} alt={property.propertyTitle} onError={() => setImageFailed(true)} />
				) : (
					<div className={'ma-car-card__placeholder'}>
						<DirectionsCarFilledOutlinedIcon />
					</div>
				)}
				<div className={'ma-car-card__badges'}>
					<span className={'ma-badge ma-badge--light'}>{formatCountry(property.carCountry, t)}</span>
					{property.propertyBarter && <span className={'ma-badge ma-badge--primary'}>{t('Barter')}</span>}
					{property.carCustomsCleared && <span className={'ma-badge ma-badge--primary'}>{t('Customs cleared')}</span>}
				</div>
				<button
					className={`ma-car-card__compare ${inCompare ? 'is-active' : ''}`}
					title={(inCompare ? t('Remove from comparison') : t('Compare')) as string}
					aria-label={t('Compare') as string}
					onClick={(e) => {
						e.stopPropagation();
						if (!toggleCompare(property._id)) sweetMixinErrorAlert(t('You can compare up to 3 cars.') as string).then();
					}}
				>
					<CompareArrowsIcon />
				</button>
				{onLike && (
					<button
						className={`ma-car-card__like ${liked ? 'is-liked' : ''}`}
						aria-label={t('Save to favorites') as string}
						onClick={(e) => {
							e.stopPropagation();
							onLike(property._id);
						}}
					>
						{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
					</button>
				)}
			</div>
			<div className={'ma-car-card__body'}>
				<div className={'ma-car-card__title-row'}>
					<h3 onClick={openDetail}>
						{property.carYear} {property.propertyTitle.replace(String(property.carYear), '').trim()}
					</h3>
					{property.carTrim && <span className={'ma-chip'}>{property.carTrim}</span>}
				</div>
				<p className={'ma-car-card__specs'}>{specs.join(' • ')}</p>
				<div className={'ma-car-card__footer'}>
					<strong className={'ma-car-card__price'}>{price(property)}</strong>
					<button className={'ma-btn ma-btn--dark'} onClick={openDetail}>
						{t('View Details')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CarCard;
