import React from 'react';
import { Skeleton } from '../ui/Feedback';
import CarGrid from './CarGrid';

/** placeholder cards with the same shape as CarCard while the list loads */
const CarGridSkeleton = ({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) => (
	<CarGrid cols={columns}>
		{Array.from({ length: count }).map((_, index) => (
			<div className="pointer-events-none flex flex-col max-sm:grid max-sm:grid-cols-[132px_minmax(0,1fr)] max-sm:gap-3" key={index}>
				<Skeleton className="aspect-[4/3] rounded-[10px]" />
				<div className="flex flex-col gap-2 pt-3 max-sm:pt-0">
					<Skeleton className="h-[22px] w-[70%]" />
					<Skeleton className="h-4 w-[90%]" />
					<Skeleton className="h-[26px] w-[40%]" />
				</div>
			</div>
		))}
	</CarGrid>
);

export default CarGridSkeleton;
