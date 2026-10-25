import React from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import NoticeManager from '../../../libs/components/admin/cs/NoticeManager';

const AdminNOTICE: NextPage = () => <NoticeManager category={'NOTICE'} />;

export default withAdminLayout(AdminNOTICE);
