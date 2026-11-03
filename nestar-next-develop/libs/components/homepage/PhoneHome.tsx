import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Direction, Message } from '../../enums/common.enum';
import { Property } from '../../types/property/property';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import CarCard from '../car/CarCard';
import { CarRow } from '../car/CarGrid';
import { VerifiedUserIcon as VerifiedUserOutlinedIcon, PublicIcon as PublicOutlinedIcon, ManageSearchIcon as ManageSearchOutlinedIcon, ForumIcon as ForumOutlinedIcon } from '../ui/icons';

const REASONS = [
	{ icon: <VerifiedUserOutlinedIcon />, title: 'Trusted sellers', text: 'Every seller confirms the phone number' },
	{ icon: <PublicOutlinedIcon />, title: 'Global market', text: 'Korea, Japan, Europe and the US in one place' },
	{ icon: <ManageSearchOutlinedIcon />, title: 'Easy search', text: 'Filters find the right car fast' },
	{ icon: <ForumOutlinedIcon />, title: 'Direct contact', text: 'Call or write to the seller, no middlemen' },
];

/** phones: "Why CarPort?" — four reasons in a row of small cards */
export const WhyCarPort = () => {
	const { t } = useTranslation('common');
	return (
		<section className="px-4 pt-6 pb-1 font-sans">
			<h2 className="m-0 mb-3 text-xl font-bold text-ink">{t('Why CarPort?')}</h2>
			<div className="grid grid-cols-4 gap-2">
				{REASONS.map((item) => (
					<div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-2 py-3 [&_svg]:text-2xl [&_svg]:text-primary" key={item.title}>
						{item.icon}
						<strong className="text-xs leading-tight text-ink">{t(item.title)}</strong>
						<span className="text-[10.5px] leading-[1.35] text-muted">{t(item.text)}</span>
					</div>
				))}
			</div>
		</section>
	);
};

const LATEST = { page: 1, limit: 8, sort: 'createdAt', direction: Direction.DESC, search: {} };

/** phones: the newest listings as a sideways row of photo cards */
export const LatestCars = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [likeTargetProperty] = useMutation<any>(LIKE_TARGET_PROPERTY);
	const { data, refetch } = useQuery<any>(GET_PROPERTIES, { fetchPolicy: 'cache-and-network', variables: { input: LATEST } });
	const cars: Property[] = data?.getProperties?.list ?? [];

	const likeHandler = async (id: string) => {
		try {
			if (!user?._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetProperty({ variables: { input: id } });
			await refetch({ input: LATEST });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	if (!cars.length) return null;
	return (
		<section className="px-4 pt-6 pb-2 font-sans">
			<div className="mb-3 flex items-baseline justify-between">
				<h2 className="m-0 text-xl font-bold text-ink">{t('New listings')}</h2>
				<Link href={'/property'} className="text-sm font-semibold text-primary">
					{t('See all')}
				</Link>
			</div>
			<CarRow>
				{cars.map((car) => (
					<CarCard key={car._id} property={car} onLike={likeHandler} layout="tile" />
				))}
			</CarRow>
		</section>
	);
};
