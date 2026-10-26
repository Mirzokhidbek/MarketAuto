import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import React from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import NoticeManager from '../../../libs/components/admin/cs/NoticeManager';


export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

const AdminNOTICE: NextPage = () => <NoticeManager category={'NOTICE'} />;

export default withAdminLayout(AdminNOTICE);
