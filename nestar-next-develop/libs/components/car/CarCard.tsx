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
import { formatEnumLabel, formatMileage, imageUrl } from '../../utils';
import Link from 'next/link';
import Origin from './Origin';

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
		if (!img) return;
		const fail = () => setImageFailed(true);
		if (img.complete && img.naturalWidth === 0) return fail();
		img.addEventListener('error', fail);
		return () => img.removeEventListener('error', fail);
	}, [property._id]);
	const image = property.propertyImages?.[0];
	const liked = !!property.meLiked?.[0]?.myFavorite;
	const place =
		property.carCountry === 'UZBEKISTAN' ? formatEnumLabel(property.propertyLocation, t) : property.propertyAddress;
	const specs = [
		formatMileage(property.carMileage),
		property.carEngine ? `${Number(property.carEngine).toFixed(1)} ${formatEnumLabel(property.carFuel, t)}` : formatEnumLabel(property.carFuel, t),
		formatEnumLabel(property.carTransmission, t),
	].filter(Boolean);

	const compareIds = useReactiveVar(compareVar);
	const inCompare = compareIds.includes(property._id);
	const href = { pathname: '/property/detail', query: { id: property._id } };
	// the whole card opens the car; the title is the real link (keyboard, middle-click, screen readers)
	const openDetail = () => router.push(href);

	return (
		<article className={'ma-car-card'} onClick={openDetail}>
			<div className={'ma-car-card__media'}>
				{image && !imageFailed ? (
					<img
						ref={imageRef}
						src={imageUrl(image)}
						alt={''}
						loading={'lazy'}
						onError={() => setImageFailed(true)}
					/>
				) : (
					<div className={'ma-car-card__placeholder'}>
						<DirectionsCarFilledOutlinedIcon />
						<span>{t('No photo')}</span>
					</div>
				)}
				{(property.propertyBarter || property.carCustomsCleared) && (
					<div className={'ma-car-card__badges'}>
						{property.carCustomsCleared && <span className={'ma-badge ma-badge--light'}>{t('Customs cleared')}</span>}
						{property.propertyBarter && (
							<span className={'ma-badge ma-badge--light'} title={t('The seller accepts a car exchange') as string}>
								{t('Barter')}
							</span>
						)}
					</div>
				)}
				<div className={'ma-car-card__actions'}>
					<button
						className={`ma-car-card__compare ${inCompare ? 'is-active' : ''}`}
						title={(inCompare ? t('Remove from comparison') : t('Compare')) as string}
						aria-label={t('Compare') as string}
						aria-pressed={inCompare}
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
							aria-pressed={liked}
							title={(liked ? t('Remove from favorites') : t('Save to favorites')) as string}
							onClick={(e) => {
								e.stopPropagation();
								onLike(property._id);
							}}
						>
							{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
						</button>
					)}
				</div>
			</div>
			<div className={'ma-car-card__body'}>
				<div className={'ma-car-card__top'}>
					<div className={'ma-car-card__title-row'}>
						<h3 title={property.propertyTitle}>
							<Link href={href} onClick={(e) => e.stopPropagation()}>
								{property.carYear} {property.propertyTitle.replace(String(property.carYear), '').trim()}
							</Link>
						</h3>
						{property.carTrim && <span className={'ma-chip'}>{property.carTrim}</span>}
					</div>
				</div>
				<p className={'ma-car-card__specs'}>{specs.join(' · ')}</p>
				<div className={'ma-car-card__footer'}>
					<strong className={'ma-car-card__price'}>{price(property)}</strong>
					<Origin country={property.carCountry} label={place || undefined} />
				</div>
			</div>
		</article>
	);
};

export default CarCard;
