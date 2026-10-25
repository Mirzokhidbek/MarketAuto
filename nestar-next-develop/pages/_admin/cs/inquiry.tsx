import React from 'react';
import type { NextPage } from 'next';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import NoticeManager from '../../../libs/components/admin/cs/NoticeManager';

const AdminINQUIRY: NextPage = () => <NoticeManager category={'INQUIRY'} />;

export default withAdminLayout(AdminINQUIRY);
