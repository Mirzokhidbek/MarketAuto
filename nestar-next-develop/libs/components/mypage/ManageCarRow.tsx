import { usePrice } from '../../hooks/usePrice';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import { Property } from '../../types/property/property';
import { PropertyStatus } from '../../enums/property.enum';
import { REACT_APP_API_URL } from '../../config';
import { formatCountry, formatEnumLabel, formatMileage, formatterStr, imageUrl } from '../../utils';

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
		<div className={'ma-manage-row'}>
			<div className={'ma-manage-row__media'} onClick={openDetail}>
				{image && !imageFailed ? (
					<img
						src={imageUrl(image)}
						alt={property.propertyTitle}
						onError={() => setImageFailed(true)}
					/>
				) : (
					<div className={'ma-car-card__placeholder'}>
						<DirectionsCarFilledOutlinedIcon />
					</div>
				)}
			</div>
			<div className={'ma-manage-row__info'}>
				<strong onClick={openDetail}>{property.propertyTitle}</strong>
				<span>
					{formatCountry(property.carCountry, t)} · {property.carYear} · {formatMileage(property.carMileage)} ·{' '}
					{formatEnumLabel(property.carTransmission, t)}
				</span>
				<div className={'ma-manage-row__stats'}>
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
			<div className={'ma-manage-row__price'}>{price(property.propertyPrice)}</div>
			<div className={'ma-manage-row__actions'}>
				{property.propertyStatus === PropertyStatus.PENDING ? (
					<span className={'ma-status ma-status--pending'} title={t('Waiting for moderation') as string}>
						{t('Under review')}
					</span>
				) : (
					<select
						className={'ma-manage-row__status'}
						value={property.propertyStatus}
						onChange={(e) => onStatusChange(e.target.value, property._id)}
					>
						<option value={PropertyStatus.ACTIVE}>{t(isActive ? 'For sale' : 'Back on sale')}</option>
						<option value={PropertyStatus.SOLD}>{t(isActive ? 'Mark as sold' : 'Sold')}</option>
					</select>
				)}
				{property.propertyStatus !== PropertyStatus.SOLD && (
					<button className={'ma-icon-btn'} onClick={openEdit} aria-label={'edit'}>
						<EditOutlinedIcon />
					</button>
				)}
				<button className={'ma-icon-btn ma-icon-btn--danger'} onClick={() => onDelete(property._id)} aria-label={'delete'}>
					<DeleteOutlineIcon />
				</button>
			</div>
		</div>
	);
};

export default ManageCarRow;
