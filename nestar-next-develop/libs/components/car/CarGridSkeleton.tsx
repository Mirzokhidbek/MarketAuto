import React from 'react';
import { Skeleton } from '../ui/Feedback';

/** placeholder cards with the same shape as CarCard while the list loads */
const CarGridSkeleton = ({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) => (
	<div className={`ma-grid ma-grid--${columns}`}>
		{Array.from({ length: count }).map((_, index) => (
			<div className={'ma-car-card ma-car-card--skeleton'} key={index}>
				<Skeleton className="h-[190px] rounded-none" />
				<div className={'ma-car-card__body'}>
					<Skeleton className="mb-2 h-[22px] w-[70%]" />
					<Skeleton className="mb-2 h-4 w-[90%]" />
					<Skeleton className="h-[30px] w-[40%]" />
				</div>
			</div>
		))}
	</div>
);

export default CarGridSkeleton;
