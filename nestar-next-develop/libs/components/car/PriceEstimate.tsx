import React from 'react';
import { useQuery } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { GET_PRICE_ESTIMATE } from '../../../apollo/user/query';
import { usePrice } from '../../hooks/usePrice';

const labels: Record<string, { text: string; box: string; title: string }> = {
	LOW: { text: 'Below market price', box: 'bg-[#e6f4ea]', title: 'text-[#188038]' },
	FAIR: { text: 'Fair market price', box: 'bg-[#eff6ff]', title: 'text-primary' },
	HIGH: { text: 'Above market price', box: 'bg-[#fef7e0]', title: 'text-[#a05a00]' },
};

/** "is this a good price?" — compared with the same brand/model, year ±1 */
const PriceEstimate = ({ propertyId }: { propertyId: string }) => {
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const { data } = useQuery<any>(GET_PRICE_ESTIMATE, { variables: { propertyId }, skip: !propertyId, fetchPolicy: 'cache-first' });
	const estimate = data?.getPriceEstimate;
	const label = labels[estimate?.verdict];
	if (!label) return null;
	return (
		<div className={`mt-2.5 mb-0.5 flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 text-[13px] ${label.box}`}>
			<strong className={`text-sm ${label.title}`}>{t(label.text)}</strong>
			<span className="text-muted">
				{t('Similar cars')}: ≈ {price(estimate.average)} ({estimate.count})
			</span>
		</div>
	);
};

export default PriceEstimate;
