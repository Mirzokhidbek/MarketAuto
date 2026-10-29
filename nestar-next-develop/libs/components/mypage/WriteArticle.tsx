import React from 'react';
import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
const ArticleEditor = dynamic(() => import('../community/ArticleEditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const { t } = useTranslation('common');

	return (
		<div id="write-article-page" className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('Write Article')}</h1>
					<p>{t('Share news, reviews or tips with other car owners.')}</p>
				</div>
			</div>
			<ArticleEditor />
		</div>
	);
};

export default WriteArticle;
