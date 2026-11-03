import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Direction, Message } from '../../enums/common.enum';
import { Property } from '../../types/property/property';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import CarCard from '../car/CarCard';

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
		<section className={'ma-why'}>
			<h2 className={'ma-why__title'}>{t('Why CarPort?')}</h2>
			<div className={'ma-why__grid'}>
				{REASONS.map((item) => (
					<div className={'ma-why__item'} key={item.title}>
						{item.icon}
						<strong>{t(item.title)}</strong>
						<span>{t(item.text)}</span>
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
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);
	const { data, refetch } = useQuery(GET_PROPERTIES, { fetchPolicy: 'cache-and-network', variables: { input: LATEST } });
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
		<section className={'ma-latest'}>
			<div className={'ma-latest__head'}>
				<h2>{t('New listings')}</h2>
				<Link href={'/property'}>{t('See all')}</Link>
			</div>
			<div className={'ma-hscroll'}>
				{cars.map((car) => (
					<CarCard key={car._id} property={car} onLike={likeHandler} />
				))}
			</div>
		</section>
	);
};
