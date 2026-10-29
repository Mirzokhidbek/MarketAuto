import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { cx } from './classNames';

interface SearchInputProps {
	value: string;
	placeholder?: string;
	onChange: (value: string) => void;
	/** Enter key */
	onSubmit: (value: string) => void;
	className?: string;
}

const SearchInput = ({ value, placeholder, onChange, onSubmit, className }: SearchInputProps) => (
	<label className={cx('relative flex items-center', className)}>
		<SearchIcon className={'pointer-events-none absolute left-3 text-[20px]! text-muted'} />
		<input
			type={'search'}
			value={value}
			placeholder={placeholder}
			aria-label={placeholder}
			onChange={(event) => onChange(event.target.value)}
			onKeyDown={(event) => {
				if (event.key === 'Enter') onSubmit(value.trim());
			}}
			className={
				'h-10 w-full rounded-sm border border-line-strong bg-white pr-3 pl-10 font-sans text-sm text-text outline-none focus:border-primary'
			}
		/>
	</label>
);

export default SearchInput;
