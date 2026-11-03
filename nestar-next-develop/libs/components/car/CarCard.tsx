import { useReactiveVar } from '@apollo/client/react';
import { compareVar } from '../../../apollo/store';
import { toggleCompare } from '../../compare';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { usePrice } from '../../hooks/usePrice';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { Property } from '../../types/property/property';
import { formatEnumLabel, formatMileage, imageUrl } from '../../utils';
import Link from 'next/link';
import CarOrigin from './CarOrigin';
import Badge from '../ui/Badge';
import { cx } from '../ui/classNames';
import { CompareArrowsIcon, FavoriteIcon, FavoriteBorderIcon, CarIcon as DirectionsCarFilledOutlinedIcon } from '../ui/icons';

interface CarCardProps {
	property: Property;
	onLike?: (id: string) => void;
	/** "list": a row (photo left) on phones, a tile above; "tile": always a tile (sideways rows) */
	layout?: 'list' | 'tile';
}

const roundButton =
	'flex size-[30px] cursor-pointer items-center justify-center rounded-full border-0 bg-white/95 text-text shadow-[0_1px_3px_rgba(15,23,42,0.15)] hover:text-ink focus-visible:outline-2 focus-visible:outline-primary sm:size-[34px] [&_svg]:text-base sm:[&_svg]:text-lg';

/** a car in a list: photo, title, key facts, price and where the car is */
const CarCard = ({ property, onLike, layout = 'list' }: CarCardProps) => {
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

	const row = layout === 'list';

	return (
		<article
			className={cx(
				'group relative flex min-w-0 cursor-pointer flex-col font-sans',
				row && 'max-sm:grid max-sm:grid-cols-[132px_minmax(0,1fr)] max-sm:gap-3 max-sm:border-b max-sm:border-line max-sm:py-3 max-sm:last:border-b-0',
			)}
			onClick={openDetail}
		>
			<div className={cx('relative aspect-[4/3] overflow-hidden rounded-[10px] bg-surface', row && 'max-sm:self-start max-sm:rounded-lg')}>
				{image && !imageFailed ? (
					<img
						ref={imageRef}
						src={imageUrl(image)}
						alt={''}
						loading={'lazy'}
						onError={() => setImageFailed(true)}
						className="size-full object-cover transition-transform duration-400 group-hover:scale-[1.025] max-sm:group-hover:scale-100"
					/>
				) : (
					<div className="flex size-full flex-col items-center justify-center gap-1.5 text-[13px] text-faint">
						<DirectionsCarFilledOutlinedIcon className="text-4xl text-line-strong" />
						<span>{t('No photo')}</span>
					</div>
				)}
				{(property.propertyBarter || property.carCustomsCleared) && (
					<div className="absolute bottom-2.5 left-2.5 flex gap-1.5 max-sm:right-1.5 max-sm:bottom-1.5 max-sm:left-1.5 max-sm:flex-wrap max-sm:gap-1">
						{property.carCustomsCleared && (
							<Badge tone="light" className="max-sm:h-auto max-sm:max-w-full max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px]">
								{t('Customs cleared')}
							</Badge>
						)}
						{property.propertyBarter && (
							<span title={t('The seller accepts a car exchange') as string} className={cx(property.carCustomsCleared && 'max-sm:hidden')}>
								<Badge tone="light" className="max-sm:h-auto max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px]">
									{t('Barter')}
								</Badge>
							</span>
						)}
					</div>
				)}
				<div className="absolute top-1.5 right-1.5 flex gap-1.5 sm:top-2.5 sm:right-2.5">
					<button
						type="button"
						className={cx(roundButton, inCompare ? 'bg-ink! text-white!' : 'max-sm:hidden')}
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
							type="button"
							className={cx(roundButton, liked && 'text-danger!')}
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
			<div className={cx('flex flex-1 flex-col px-0.5 pt-3', row && 'max-sm:min-w-0 max-sm:p-0')}>
				<div className={cx('flex min-w-0 items-center gap-2', row && 'max-sm:flex-wrap max-sm:gap-y-1')}>
					<h3
						title={property.propertyTitle}
						className={cx(
							'm-0 min-w-0 overflow-hidden text-[15.5px] leading-[1.35] font-semibold text-ellipsis whitespace-nowrap text-ink group-hover:text-primary',
							row && 'max-sm:line-clamp-2 max-sm:text-[15px] max-sm:whitespace-normal',
						)}
					>
						<Link href={href} onClick={(e) => e.stopPropagation()} className="text-inherit">
							{property.carYear} {property.propertyTitle.replace(String(property.carYear), '').trim()}
						</Link>
					</h3>
					{property.carTrim && (
						<span className="shrink-0 rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] text-muted sm:text-[11.5px]">{property.carTrim}</span>
					)}
				</div>
				<p className="mt-1 mb-2 text-[13.5px] leading-[1.45] text-muted tabular-nums max-sm:mb-1.5 max-sm:text-[12.5px]">{specs.join(' · ')}</p>
				<div className={cx('mt-auto flex items-center justify-between gap-3', row && 'max-sm:flex-col max-sm:items-start max-sm:gap-0.5')}>
					<strong className="shrink-0 text-[17px] font-bold tracking-[-0.01em] text-ink tabular-nums sm:text-lg">{price(property)}</strong>
					<CarOrigin country={property.carCountry} label={place || undefined} className="max-w-full max-sm:text-[12.5px]" />
				</div>
			</div>
		</article>
	);
};

export default CarCard;
