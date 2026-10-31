import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import LegalDocument from '../libs/components/legal/LegalDocument';
import { privacy } from '../libs/legal';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const LegalPage: NextPage = () => <LegalDocument docs={privacy} />;

export default withLayoutBasic(LegalPage);
