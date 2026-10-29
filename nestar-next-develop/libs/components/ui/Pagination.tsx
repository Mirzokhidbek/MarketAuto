import React from 'react';
import { Pagination as MuiPagination } from '@mui/material';

interface PaginationProps {
	page: number;
	total: number;
	pageSize: number;
	onChange: (page: number) => void;
}

/** page numbers under a list; hidden when everything fits on one page */
const Pagination = ({ page, total, pageSize, onChange }: PaginationProps) => {
	const pageCount = Math.ceil(total / pageSize);
	if (pageCount <= 1) return null;

	return (
		<nav className={'mt-9 flex justify-center'}>
			<MuiPagination
				page={page}
				count={pageCount}
				shape={'rounded'}
				onChange={(_, value) => onChange(value)}
				sx={{
					'& .MuiPaginationItem-root': { borderRadius: '6px', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' },
					'& .MuiPaginationItem-root.Mui-selected, & .MuiPaginationItem-root.Mui-selected:hover': {
						background: '#0f172a',
						color: '#fff',
					},
				}}
			/>
		</nav>
	);
};

export default Pagination;
