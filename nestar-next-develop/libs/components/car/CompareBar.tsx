import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useReactiveVar } from '@apollo/client/react';
import { compareVar } from '../../../apollo/store';
import { clearCompare } from '../../compare';
import { buttonClasses } from '../ui/Button';

/** shows how many cars are picked for comparison, on every page except /compare */
const CompareBar = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const ids = useReactiveVar(compareVar);
	if (!ids.length || router.pathname === '/compare') return null;
	return (
		<div className="fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-[1200] flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3.5 rounded-[10px] bg-ink py-2.5 pr-3 pl-5 font-sans text-sm text-white shadow-float max-sm:bottom-[calc(74px+env(safe-area-inset-bottom))] max-sm:[body:has(.ma-contact-bar)_&]:bottom-[84px]">
			<span>
				{t('Cars to compare')}: <strong>{ids.length}/3</strong>
			</span>
			<Link href={'/compare'} className={buttonClasses({ size: 'sm' })}>
				{t('Compare')}
			</Link>
			<button type="button" className="cursor-pointer border-0 bg-transparent text-[#94a3b8]" onClick={clearCompare}>
				{t('Clear')}
			</button>
		</div>
	);
};

export default CompareBar;
