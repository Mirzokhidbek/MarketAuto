import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { terms } from '../libs/legal';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const LegalPage: NextPage = () => {
	const { locale } = useRouter();
	const doc = terms[locale ?? 'en'] ?? terms.en;
	return (
		<div className={'ma-page'}>
			<div className={'ma-container ma-container--narrow ma-legal'}>
				<p className={'ma-legal__updated'}>{doc.updated}</p>
				<p className={'ma-legal__intro'}>{doc.intro}</p>
				{doc.sections.map((section) => (
					<section key={section.title}>
						<h2>{section.title}</h2>
						{section.text.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</section>
				))}
			</div>
		</div>
	);
};

export default withLayoutBasic(LegalPage);
