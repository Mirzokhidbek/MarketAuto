import React, { useState } from 'react';
import moment from 'moment';

interface DailyColumnsProps {
	title: string;
	/** oldest first, date as YYYY-MM-DD */
	points: { date: string; value: number }[];
	total: string;
}

/**
 * One series per chart (small multiples instead of two scales on one axis):
 * thin columns from one baseline, value of the highest and of today printed, every value in the tooltip.
 */
const DailyColumns = ({ title, points, total }: DailyColumnsProps) => {
	const [hover, setHover] = useState<number | null>(null);
	const max = Math.max(1, ...points.map((point) => point.value));
	const peak = points.reduce((best, point, index) => (point.value > points[best].value ? index : best), 0);
	const sum = points.reduce((acc, point) => acc + point.value, 0);
	const last = points.length - 1;

	return (
		<figure className={'ma-viz'}>
			<figcaption className={'ma-viz__head'}>
				<span>{title}</span>
				<strong>{sum}</strong>
				<em>{total}</em>
			</figcaption>
			<div className={'ma-viz__plot'} onMouseLeave={() => setHover(null)}>
				{points.map((point, index) => {
					const labelled = point.value > 0 && (index === peak || index === last);
					return (
						<button
							type="button"
							key={point.date}
							className={`ma-viz__slot ${hover === index ? 'is-hover' : ''}`}
							aria-label={`${moment(point.date).format('DD.MM')}: ${point.value}`}
							onMouseEnter={() => setHover(index)}
							onFocus={() => setHover(index)}
							onBlur={() => setHover(null)}
						>
							{labelled && hover !== index && <span className={'ma-viz__value'}>{point.value}</span>}
							<span className={'ma-viz__bar'} style={{ height: `${(point.value / max) * 100}%` }} />
							{hover === index && (
								<span className={'ma-viz__tip'} role={'tooltip'}>
									<strong>{point.value}</strong>
									<small>{moment(point.date).format('DD.MM.YYYY')}</small>
								</span>
							)}
						</button>
					);
				})}
			</div>
			<div className={'ma-viz__axis'}>
				{points.map((point, index) => (
					<span key={point.date}>{index % 3 === last % 3 ? moment(point.date).format('DD.MM') : ''}</span>
				))}
			</div>
		</figure>
	);
};

export default DailyColumns;
