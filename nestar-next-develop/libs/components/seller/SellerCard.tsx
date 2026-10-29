import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SellerTrust from './SellerTrust';
import Badge from '../ui/Badge';
import { ButtonLink } from '../ui/Button';
import { cx } from '../ui/classNames';
import { imageUrl } from '../../utils';
import { Member } from '../../types/member/member';

interface SellerCardProps {
	seller: Member;
	onLike?: (id: string) => void;
}

/** a compact seller profile: avatar and name, trust checks, counters, link to the profile */
const SellerCard = ({ seller, onLike }: SellerCardProps) => {
	const { t } = useTranslation('common');
	const liked = !!seller.meLiked?.[0]?.myFavorite;
	const profileHref = { pathname: '/member', query: { memberId: seller._id } };
	const stats = [
		{ value: seller.memberProperties, label: t('cars') },
		{ value: seller.memberLikes, label: t('likes') },
		{ value: seller.memberViews, label: t('views') },
	];

	return (
		<article
			className={
				'relative flex flex-col rounded-md border border-line bg-white p-5 font-sans transition-colors hover:border-line-strong'
			}
		>
			{onLike && (
				<button
					type={'button'}
					onClick={() => onLike(seller._id)}
					aria-label={t('Like') as string}
					aria-pressed={liked}
					className={cx(
						'absolute top-3.5 right-3.5 flex size-[34px] cursor-pointer items-center justify-center rounded-full [&_svg]:text-[18px]!',
						liked ? 'text-danger' : 'text-text hover:text-ink',
					)}
				>
					{liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
				</button>
			)}

			<div className={'flex items-center gap-3.5 pr-8'}>
				<Link href={profileHref} className={'shrink-0'}>
					<img
						src={seller.memberImage ? imageUrl(seller.memberImage) : '/img/profile/defaultUser.svg'}
						alt={seller.memberNick}
						className={'size-14 rounded-full bg-surface-alt object-cover'}
					/>
				</Link>
				<div className={'min-w-0'}>
					<Link href={profileHref} className={'block'}>
						<h3 className={'truncate text-[15.5px] font-semibold text-ink hover:text-primary'}>
							{seller.memberFullName || seller.memberNick}
						</h3>
					</Link>
					<Badge className={'mt-1'}>{t(seller.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</Badge>
				</div>
			</div>

			<SellerTrust member={seller} compact className={'mt-3'} />
			{seller.memberAddress && <p className={'mt-1.5 text-[13px] text-muted'}>{seller.memberAddress}</p>}

			<dl className={'mt-3.5 mb-3 grid grid-cols-3 border-t border-line pt-3'}>
				{stats.map((stat) => (
					<div key={stat.label} className={'flex flex-col-reverse'}>
						<dt className={'text-xs text-muted'}>{stat.label}</dt>
						<dd className={'text-base font-semibold text-ink tabular-nums'}>{stat.value ?? 0}</dd>
					</div>
				))}
			</dl>

			<ButtonLink href={profileHref} variant={'outline'} size={'sm'} block className={'mt-auto'}>
				{t('View profile')}
			</ButtonLink>
		</article>
	);
};

export default SellerCard;
