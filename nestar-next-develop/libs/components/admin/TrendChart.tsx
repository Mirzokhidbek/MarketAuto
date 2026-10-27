import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';

export interface TrendSeries {
	key: string;
	label: string;
	/** categorical slot color (fixed order: slot 1 blue, slot 2 orange) */
	color: string;
	values: number[];
}

interface TrendChartProps {
	/** YYYY-MM-DD, oldest first, same length as every series */
	dates: string[];
	series: TrendSeries[];
	/** text for the table toggle */
	tableLabel: string;
	chartLabel: string;
	dateLabel: string;
}

const HEIGHT = 290;
const PAD = { top: 16, right: 44, bottom: 30, left: 8 };

/** 0, 1, 2, 5, 10, 20, 50... upper bound so the axis gets round numbers */
const niceMax = (value: number) => {
	if (value <= 4) return 4;
	const power = 10 ** Math.floor(Math.log10(value));
	const step = [1, 2, 5, 10].find((m) => m * power >= value / 4)! * power;
	return step * 4;
};

/** monotone cubic path: smooth like the reference, but never dips below a real value (no fake negatives) */
const smoothPath = (points: [number, number][]) => {
	if (points.length < 2) return '';
	const n = points.length;
	const dx: number[] = [];
	const slope: number[] = [];
	for (let i = 0; i < n - 1; i++) {
		dx.push(points[i + 1][0] - points[i][0]);
		slope.push((points[i + 1][1] - points[i][1]) / dx[i]);
	}
	const tangent: number[] = [slope[0]];
	for (let i = 1; i < n - 1; i++) tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
	tangent.push(slope[n - 2]);
	let d = `M${points[0][0]},${points[0][1]}`;
	for (let i = 0; i < n - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const h = dx[i] / 3;
		d += ` C${x0 + h},${y0 + tangent[i] * h} ${x1 - h},${y1 - tangent[i + 1] * h} ${x1},${y1}`;
	}
	return d;
};

/**
 * Daily counts as area + line, one shared axis (both series are "count per day").
 * Legend always shown with each series' total, the last day marked on the lines, crosshair tooltip lists every series,
 * arrow keys move the crosshair, and a table view holds the same numbers.
 */
const TrendChart = ({ dates, series, tableLabel, chartLabel, dateLabel }: TrendChartProps) => {
	const boxRef = useRef<HTMLDivElement>(null);
	const [width, setWidth] = useState<number>(600);
	const [active, setActive] = useState<number | null>(null);
	const [asTable, setAsTable] = useState<boolean>(false);

	useEffect(() => {
		if (!boxRef.current) return;
		const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
		observer.observe(boxRef.current);
		return () => observer.disconnect();
	}, [asTable]);

	const max = useMemo(() => niceMax(Math.max(1, ...series.flatMap((item) => item.values))), [series]);
	const plotW = width - PAD.left - PAD.right;
	const plotH = HEIGHT - PAD.top - PAD.bottom;
	const x = (index: number) => PAD.left + (dates.length < 2 ? plotW / 2 : (index / (dates.length - 1)) * plotW);
	const y = (value: number) => PAD.top + plotH - (value / max) * plotH;
	const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
	// about 7 date labels whatever the period, always including today
	const labelEvery = Math.max(1, Math.ceil(dates.length / 7));
	const last = dates.length - 1;

	const pick = (clientX: number) => {
		const box = boxRef.current?.getBoundingClientRect();
		if (!box || !dates.length) return;
		const ratio = (clientX - box.left - PAD.left) / plotW;
		setActive(Math.min(last, Math.max(0, Math.round(ratio * last))));
	};

	const legend = (
		<div className={'ma-trend__legend'}>
			{series.map((item) => (
				<span key={item.key}>
					<i style={{ background: item.color }} />
					{item.label}
					<b>{item.values.reduce((sum, value) => sum + value, 0)}</b>
				</span>
			))}
			<button type="button" className={'ma-trend__toggle'} onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
				{asTable ? chartLabel : tableLabel}
			</button>
		</div>
	);

	if (asTable) {
		return (
			<div className={'ma-trend'}>
				{legend}
				<div className={'ma-trend__table'}>
					<table>
						<thead>
							<tr>
								<th>{dateLabel}</th>
								{series.map((item) => (
									<th key={item.key}>{item.label}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[...dates].reverse().map((date, reversed) => {
								const index = last - reversed;
								return (
									<tr key={date}>
										<td>{moment(date).format('DD.MM.YYYY')}</td>
										{series.map((item) => (
											<td key={item.key}>{item.values[index]}</td>
										))}
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	const tipLeft = active === null ? 0 : Math.min(Math.max(x(active), 80), width - 80);

	return (
		<div className={'ma-trend'}>
			{legend}
			<div
				ref={boxRef}
				className={'ma-trend__plot'}
				tabIndex={0}
				role={'img'}
				aria-label={series.map((item) => `${item.label}: ${item.values.reduce((a, b) => a + b, 0)}`).join(', ')}
				onPointerMove={(e) => pick(e.clientX)}
				onPointerLeave={() => setActive(null)}
				onBlur={() => setActive(null)}
				onKeyDown={(e) => {
					if (e.key === 'ArrowLeft') setActive((prev) => Math.max(0, (prev ?? last) - 1));
					if (e.key === 'ArrowRight') setActive((prev) => Math.min(last, (prev ?? last - 1) + 1));
				}}
				onFocus={() => setActive(last)}
			>
				<svg width={width} height={HEIGHT} aria-hidden="true">
					{ticks.map((tick) => (
						<g key={tick}>
							<line className={'ma-trend__grid'} x1={PAD.left} x2={PAD.left + plotW} y1={y(tick)} y2={y(tick)} />
							<text className={'ma-trend__axis'} x={width - 4} y={y(tick) + 4} textAnchor="end">
								{Math.round(tick)}
							</text>
						</g>
					))}
					{series.map((item) => {
						const points = item.values.map((value, index) => [x(index), y(value)] as [number, number]);
						const line = smoothPath(points);
						const area = `${line} L${x(last)},${y(0)} L${x(0)},${y(0)} Z`;
						return (
							<g key={item.key}>
								<path d={area} fill={item.color} opacity={0.1} />
								<path d={line} fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
							</g>
						);
					})}
					{active !== null && (
						<>
							<line className={'ma-trend__cross'} x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} />
							{series.map((item) => (
								<circle
									key={item.key}
									cx={x(active)}
									cy={y(item.values[active])}
									r={5}
									fill={item.color}
									stroke="#fff"
									strokeWidth={2}
								/>
							))}
						</>
					)}
					{/* the last day (today) marked on each line; hidden while the crosshair sits on it */}
					{active !== last &&
						series.map((item) => (
							<circle key={item.key} cx={x(last)} cy={y(item.values[last])} r={4} fill={item.color} stroke="#fff" strokeWidth={2} />
						))}
					{dates.map((date, index) =>
						(last - index) % labelEvery === 0 ? (
							<text key={date} className={'ma-trend__axis'} x={x(index)} y={HEIGHT - 8} textAnchor="middle">
								{moment(date).format(dates.length > 10 ? 'DD.MM' : 'dd')}
							</text>
						) : null,
					)}
				</svg>
				{active !== null && (
					<div className={'ma-trend__tip'} style={{ left: tipLeft }} role={'tooltip'}>
						<small>{moment(dates[active]).format('DD MMMM, dddd')}</small>
						{series.map((item) => (
							<div key={item.key} className={'ma-trend__tip-row'}>
								<i style={{ background: item.color }} />
								<strong>{item.values[active]}</strong>
								<span>{item.label}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default TrendChart;
