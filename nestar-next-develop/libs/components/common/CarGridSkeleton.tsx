import React from 'react';
import { Skeleton } from '@mui/material';

/** placeholder cards with the same shape as CarCard while the list loads */
const CarGridSkeleton = ({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) => (
	<div className={`ma-grid ma-grid--${columns}`}>
		{Array.from({ length: count }).map((_, index) => (
			<div className={'ma-car-card ma-car-card--skeleton'} key={index}>
				<Skeleton variant="rectangular" height={190} animation="wave" />
				<div className={'ma-car-card__body'}>
					<Skeleton width="70%" height={26} animation="wave" />
					<Skeleton width="90%" animation="wave" />
					<Skeleton width="40%" height={34} animation="wave" />
				</div>
			</div>
		))}
	</div>
);

export default CarGridSkeleton;
