import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { GET_PROPERTIES } from '../../../apollo/user/query';
import { LIKE_TARGET_PROPERTY } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { CarCountry } from '../../enums/property.enum';
import { Direction, Message } from '../../enums/common.enum';
import { Property } from '../../types/property/property';
import { PropertiesInquiry } from '../../types/property/property.input';
import { countryName } from '../../utils';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import CarCard from '../car/CarCard';

const hubCountries = [
	CarCountry.UZBEKISTAN,
	CarCountry.SOUTH_KOREA,
	CarCountry.CHINA,
	CarCountry.JAPAN,
	CarCountry.USA,
	CarCountry.GERMANY,
	CarCountry.UAE,
];

const buildInput = (country: CarCountry | null): PropertiesInquiry => ({
	page: 1,
	limit: 6,
	sort: 'createdAt',
	direction: Direction.DESC,
	search: country ? { countryList: [country] } : {},
});

const CountryHub = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [country, setCountry] = useState<CarCountry | null>(null);
	const [likeTargetProperty] = useMutation(LIKE_TARGET_PROPERTY);

	const { data, loading, refetch } = useQuery(GET_PROPERTIES, {
		fetchPolicy: 'cache-and-network',
		variables: { input: buildInput(country) },
		notifyOnNetworkStatusChange: true,
	});
	const cars: Property[] = data?.getProperties?.list ?? [];

	const likeHandler = async (id: string) => {
		try {
			if (!user?._id) throw new Error(Message.NOT_AUTHENTICATED);
			await likeTargetProperty({ variables: { input: id } });
			await refetch({ input: buildInput(country) });
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const seeAllInput = JSON.stringify({ ...buildInput(country), limit: 9 });

	return (
		<section className={'ma-section'}>
			<div className={'ma-container'}>
				<div className={'ma-hub__head'}>
					<div>
						<h2 className={'ma-title'}>{t('Explore by Country')}</h2>
						<p className={'ma-subtitle'}>{t('Cars listed by sellers in Uzbekistan and abroad')}</p>
					</div>
					<div className={'ma-tabs'}>
						<button className={`ma-tab ${country === null ? 'is-active' : ''}`} onClick={() => setCountry(null)}>
							{t('All')}
						</button>
						{hubCountries.map((item) => (
							<button
								key={item}
								className={`ma-tab ${country === item ? 'is-active' : ''}`}
								onClick={() => setCountry(item)}
							>
								{countryName(item, t)}
							</button>
						))}
					</div>
				</div>

				{cars.length ? (
					<div className={'ma-grid ma-grid--3'}>
						{cars.map((car) => (
							<CarCard key={car._id} property={car} onLike={likeHandler} />
						))}
					</div>
				) : (
					<div className={'ma-empty'}>{loading ? t('Loading...') : t('No cars from this country yet.')}</div>
				)}

				<div className={'ma-center'}>
					<Link href={`/property?input=${seeAllInput}`}>
						<span className={'ma-btn ma-btn--outline'}>{t('See All Cars')} →</span>
					</Link>
				</div>
			</div>
		</section>
	);
};

export default CountryHub;
