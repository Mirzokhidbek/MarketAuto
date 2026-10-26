import React from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_PRICE_ESTIMATE } from '../../../apollo/user/query';
import { usePrice } from '../../hooks/usePrice';

const labels: Record<string, { text: string; className: string }> = {
	LOW: { text: 'Below market price', className: 'is-low' },
	FAIR: { text: 'Fair market price', className: 'is-fair' },
	HIGH: { text: 'Above market price', className: 'is-high' },
};

/** "is this a good price?" — compared with the same brand/model, year ±1 */
const PriceEstimate = ({ propertyId }: { propertyId: string }) => {
	const { t } = useTranslation('common');
	const { price } = usePrice();
	const { data } = useQuery(GET_PRICE_ESTIMATE, { variables: { propertyId }, skip: !propertyId, fetchPolicy: 'cache-first' });
	const estimate = data?.getPriceEstimate;
	const label = labels[estimate?.verdict];
	if (!label) return null;
	return (
		<div className={`ma-estimate ${label.className}`}>
			<strong>{t(label.text)}</strong>
			<span>
				{t('Similar cars')}: ≈ {price(estimate.average)} ({estimate.count})
			</span>
		</div>
	);
};

export default PriceEstimate;
