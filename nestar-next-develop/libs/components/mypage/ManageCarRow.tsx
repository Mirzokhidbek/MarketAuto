import { usePrice } from '../../hooks/usePrice';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import moment from 'moment';
import { Property } from '../../types/property/property';
import { PropertyStatus } from '../../enums/property.enum';
import { REACT_APP_API_URL } from '../../config';
import { formatCountry, formatEnumLabel, formatMileage, formatterStr, imageUrl } from '../../utils';
import { EditIcon as EditOutlinedIcon, DeleteIcon as DeleteOutlineIcon, EyeIcon as RemoveRedEyeOutlinedIcon, FavoriteBorderIcon, CarIcon as DirectionsCarFilledOutlinedIcon } from '../ui/icons';
import { iconButton, iconButtonDanger, linkButton, statusPill, statusTone } from '../ui/styles';

interface ManageCarRowProps {
	property: Property;
	onDelete: (id: string) => void;
	onStatusChange: (status: string, id: string) => void;
}

const ManageCarRow = ({ property, onDelete, onStatusChange }: ManageCarRowProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const [imageFailed, setImageFailed] = useState(false);
	const image = property.propertyImages?.[0];
	const isActive = property.propertyStatus === PropertyStatus.ACTIVE;

	const openDetail = () => router.push({ pathname: '/property/detail', query: { id: property._id } });
	const openEdit = () =>
		router.push({ pathname: '/mypage', query: { category: 'addProperty', propertyId: property._id } });

	return (
		<div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-[18px] rounded-xl border border-line p-3 font-sans hover:border-[#cbd5e1] sm:grid-cols-[132px_minmax(0,1fr)_auto_auto]">
			<div className="h-[72px] cursor-pointer overflow-hidden rounded-[10px] bg-surface sm:h-[88px]" onClick={openDetail}>
				{image && !imageFailed ? (
					<img
						src={imageUrl(image)}
						alt={property.propertyTitle}
						className="size-full object-cover"
						onError={() => setImageFailed(true)}
					/>
				) : (
					<div className="flex size-full items-center justify-center text-faint">
						<DirectionsCarFilledOutlinedIcon className="text-[40px]" />
					</div>
				)}
			</div>
			<div className="min-w-0">
				<strong className="mb-1 block cursor-pointer overflow-hidden text-[15px] text-ellipsis whitespace-nowrap text-ink hover:text-primary" onClick={openDetail}>{property.propertyTitle}</strong>
				{/* moderation said why: fix the listing (edit) and it goes back to review */}
				{property.propertyStatus === PropertyStatus.REJECTED && (
					<p className="m-0 mb-1.5 rounded-lg bg-[#fce8e6] px-2.5 py-1.5 text-[13px] leading-[1.4] text-[#a50e0e]">
						<b>{t('Rejected')}:</b> {property.propertyRejectReason || t('No reason given')}.{' '}
						<button type="button" className={linkButton} onClick={openEdit}>
							{t('Fix and send again')}
						</button>
					</p>
				)}
				<span className="text-[13px] text-muted">
					{formatCountry(property.carCountry, t)} · {property.carYear} · {formatMileage(property.carMileage)} ·{' '}
					{formatEnumLabel(property.carTransmission, t)}
				</span>
				<div className="mt-2 flex gap-3.5 text-xs text-muted [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1 [&_svg]:text-[15px]">
					<span>
						<RemoveRedEyeOutlinedIcon /> {property.propertyViews}
					</span>
					<span>
						<FavoriteBorderIcon /> {property.propertyLikes}
					</span>
					<span>
						{t('Listed')} {moment(property.createdAt).format('DD MMM YYYY')}
					</span>
				</div>
			</div>
			<div className="text-lg font-bold text-ink max-sm:col-start-2">{price(property)}</div>
			<div className="flex items-center gap-2 max-sm:col-span-full max-sm:justify-end [&>button]:w-10 [&>button]:justify-center [&>button]:px-0">
				{property.propertyStatus === PropertyStatus.PENDING ? (
					<span className={`${statusPill} ${statusTone.PENDING}`} title={t('Waiting for moderation') as string}>
						{t('Under review')}
					</span>
				) : property.propertyStatus === PropertyStatus.REJECTED ? (
					<span className={`${statusPill} ${statusTone.REJECTED}`}>{t('Rejected')}</span>
				) : (
					<select
						className="h-10 cursor-pointer rounded-[10px] border border-line bg-surface px-2.5 font-sans text-[13px]"
						value={property.propertyStatus}
						onChange={(e) => onStatusChange(e.target.value, property._id)}
					>
						<option value={PropertyStatus.ACTIVE}>{t(isActive ? 'For sale' : 'Back on sale')}</option>
						<option value={PropertyStatus.SOLD}>{t(isActive ? 'Mark as sold' : 'Sold')}</option>
					</select>
				)}
				{property.propertyStatus !== PropertyStatus.SOLD && (
					<button className={iconButton} onClick={openEdit} aria-label={t('Edit') as string}>
						<EditOutlinedIcon />
					</button>
				)}
				<button className={iconButtonDanger} onClick={() => onDelete(property._id)} aria-label={t('Delete') as string}>
					<DeleteOutlineIcon />
				</button>
			</div>
		</div>
	);
};

export default ManageCarRow;
