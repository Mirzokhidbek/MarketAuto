import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
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
import CarGrid from '../car/CarGrid';
import PageContainer from '../ui/PageContainer';
import { buttonClasses } from '../ui/Button';
import { cx } from '../ui/classNames';
import SectionHead from './SectionHead';

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
	const [likeTargetProperty] = useMutation<any>(LIKE_TARGET_PROPERTY);

	const { data, loading, refetch } = useQuery<any>(GET_PROPERTIES, {
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
		<section className="py-14 md:py-16">
			<PageContainer>
				<SectionHead title={t('Explore by Country')} subtitle={t('Cars listed by sellers in Uzbekistan and abroad')}>
					<div className="flex max-w-full gap-x-5 gap-y-1 overflow-x-auto [scrollbar-width:none] md:flex-wrap [&::-webkit-scrollbar]:hidden">
						{[null, ...hubCountries].map((item) => (
							<button
								key={item ?? 'all'}
								type="button"
								className={cx(
									'h-[34px] shrink-0 cursor-pointer border-0 border-b-2 bg-transparent p-0 font-sans text-sm font-semibold transition-colors hover:text-ink',
									country === item ? 'border-ink text-ink' : 'border-transparent text-muted',
								)}
								onClick={() => setCountry(item)}
							>
								{item ? countryName(item, t) : t('All')}
							</button>
						))}
					</div>
				</SectionHead>

				{cars.length ? (
					<CarGrid>
						{cars.map((car) => (
							<CarCard key={car._id} property={car} onLike={likeHandler} />
						))}
					</CarGrid>
				) : (
					<div className="border-y border-line px-6 py-14 text-center font-sans text-[15px] text-muted">
						{loading ? t('Loading...') : t('No cars from this country yet.')}
					</div>
				)}

				<div className="mt-8 flex justify-center">
					<Link href={`/property?input=${seeAllInput}`} className={buttonClasses({ variant: 'outline' })}>
						{t('See All Cars')} →
					</Link>
				</div>
			</PageContainer>
		</section>
	);
};

export default CountryHub;
