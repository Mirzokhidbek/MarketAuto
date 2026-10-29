import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { compareVar } from '../../../apollo/store';
import { clearCompare } from '../../compare';

/** shows how many cars are picked for comparison, on every page except /compare */
const CompareBar = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const ids = useReactiveVar(compareVar);
	if (!ids.length || router.pathname === '/compare') return null;
	return (
		<div className={'ma-compare-bar'}>
			<span>
				{t('Cars to compare')}: <strong>{ids.length}/3</strong>
			</span>
			<Link href={'/compare'}>
				<span className={'ma-btn ma-btn--primary'}>{t('Compare')}</span>
			</Link>
			<button onClick={clearCompare}>{t('Clear')}</button>
		</div>
	);
};

export default CompareBar;
