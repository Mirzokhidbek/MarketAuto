import React from 'react';

/** a section title with an optional line under it and something on the right (tabs, "see all") */
const SectionHead = ({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) => (
	<div className="mb-6 flex flex-col items-start justify-between gap-x-6 gap-y-4 font-sans md:flex-row md:flex-wrap md:items-end">
		<div>
			<h2 className="m-0 text-[26px] leading-[1.2] font-bold tracking-[-0.02em] text-ink">{title}</h2>
			{subtitle && <p className="mt-1.5 mb-0 text-[15px] leading-[1.55] text-muted">{subtitle}</p>}
		</div>
		{children}
	</div>
);

export default SectionHead;
