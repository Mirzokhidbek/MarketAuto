import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import { Property } from '../../types/property/property';
import { REACT_APP_API_URL } from '../../config';
import { formatCountry, formatEnumLabel, formatMileage, formatterStr } from '../../utils';

interface CarCardProps {
	property: Property;
	onLike?: (id: string) => void;
}

const CarCard = ({ property, onLike }: CarCardProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [imageFailed, setImageFailed] = useState(false);
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

	const openDetail = () => router.push({ pathname: '/property/detail', query: { id: property._id } });

	return (
		<div className={'ma-car-card'}>
			<div className={'ma-car-card__media'} onClick={openDetail}>
				{image && !imageFailed ? (
					<img src={`${REACT_APP_API_URL}/${image}`} alt={property.propertyTitle} onError={() => setImageFailed(true)} />
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
				{onLike && (
					<button
						className={`ma-car-card__like ${liked ? 'is-liked' : ''}`}
						aria-label={'favorite'}
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
					<strong className={'ma-car-card__price'}>${formatterStr(property.propertyPrice)}</strong>
					<button className={'ma-btn ma-btn--dark'} onClick={openDetail}>
						{t('View Details')}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CarCard;
