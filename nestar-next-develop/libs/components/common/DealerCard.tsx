import SellerTrust from './SellerTrust';
import { imageUrl } from '../../utils';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Member } from '../../types/member/member';
import { REACT_APP_API_URL } from '../../config';

interface DealerCardProps {
	dealer: Member;
	onLike?: (id: string) => void;
}

const DealerCard = ({ dealer, onLike }: DealerCardProps) => {
	const { t } = useTranslation('common');
	const liked = !!dealer.meLiked?.[0]?.myFavorite;
	const href = { pathname: '/member', query: { memberId: dealer._id } };

	return (
		<div className={'ma-dealer-card'}>
			{onLike && (
				<button className={`ma-car-card__like ${liked ? 'is-liked' : ''}`} onClick={() => onLike(dealer._id)} aria-label={'like'}>
					{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
				</button>
			)}
			<Link href={href}>
				<img
					src={dealer.memberImage ? imageUrl(dealer.memberImage) : '/img/profile/defaultUser.svg'}
					alt={dealer.memberNick}
				/>
			</Link>
			<Link href={href}>
				<h3>{dealer.memberFullName || dealer.memberNick}</h3>
			</Link>
			<span className={'ma-badge ma-badge--primary'}>{t(dealer.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</span>
			<SellerTrust member={dealer} compact />
			{dealer.memberAddress && <p className={'ma-dealer-card__address'}>{dealer.memberAddress}</p>}
			<div className={'ma-dealer-card__stats'}>
				<div>
					<strong>{dealer.memberProperties}</strong>
					<span>{t('cars')}</span>
				</div>
				<div>
					<strong>{dealer.memberLikes}</strong>
					<span>{t('likes')}</span>
				</div>
				<div>
					<strong>{dealer.memberViews}</strong>
					<span>{t('views')}</span>
				</div>
			</div>
			<Link href={href}>
				<span className={'ma-btn ma-btn--outline ma-btn--block'}>{t('View profile')}</span>
			</Link>
		</div>
	);
};

export default DealerCard;
