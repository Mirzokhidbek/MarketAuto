import React from 'react';
import { cx } from './classNames';

interface SortOption {
	value: string;
	label: string;
}

interface SortSelectProps {
	label: string;
	value: string;
	options: SortOption[];
	onChange: (value: string) => void;
	className?: string;
}

const SortSelect = ({ label, value, options, onChange, className }: SortSelectProps) => (
	<label className={cx('flex items-center gap-2.5 font-sans', className)}>
		<span className={'text-sm whitespace-nowrap text-muted'}>{label}</span>
		<select
			value={value}
			onChange={(event) => onChange(event.target.value)}
			className={
				'h-10 min-w-0 flex-1 cursor-pointer rounded-sm border border-line-strong bg-white px-3 font-sans text-sm text-text outline-none focus:border-primary'
			}
		>
			{options.map((option) => (
				<option value={option.value} key={option.value}>
					{option.label}
				</option>
			))}
		</select>
	</label>
);

export default SortSelect;
