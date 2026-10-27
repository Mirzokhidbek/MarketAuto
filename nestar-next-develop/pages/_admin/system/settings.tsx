import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_SITE_SETTINGS } from '../../../apollo/user/query';
import { UPDATE_SITE_SETTINGS } from '../../../apollo/admin/mutation';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type Settings = Record<'supportPhone' | 'supportEmail' | 'telegramUrl' | 'instagramUrl' | 'facebookUrl', string>;
const EMPTY: Settings = { supportPhone: '', supportEmail: '', telegramUrl: '', instagramUrl: '', facebookUrl: '' };

const FIELDS: { key: keyof Settings; label: string; placeholder: string }[] = [
	{ key: 'supportPhone', label: 'Support phone', placeholder: '+998 71 200 00 00' },
	{ key: 'supportEmail', label: 'Support email', placeholder: 'support@marketauto.uz' },
	{ key: 'telegramUrl', label: 'Telegram', placeholder: 'https://t.me/marketauto' },
	{ key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/marketauto' },
	{ key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/marketauto' },
];

const isUrl = (value: string) => !value || /^https:\/\/[^\s]+$/.test(value);
const isEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** contacts shown in the footer and the help center; empty fields fall back to the defaults */
const AdminSettings: NextPage = () => {
	const { t } = useTranslation('common');
	const [form, setForm] = useState<Settings>(EMPTY);
	const { data } = useQuery(GET_SITE_SETTINGS, { fetchPolicy: 'network-only' });
	const [updateSiteSettings, { loading }] = useMutation(UPDATE_SITE_SETTINGS, { refetchQueries: [GET_SITE_SETTINGS] });

	useEffect(() => {
		const saved = data?.getSiteSettings;
		if (saved) setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, saved[key] ?? ''])) as Settings);
	}, [data]);

	const errorOf = (key: keyof Settings): string => {
		const value = form[key].trim();
		if (key.endsWith('Url') && !isUrl(value)) return t('Link must start with https://') as string;
		if (key === 'supportEmail' && !isEmail(value)) return t('Enter a valid email') as string;
		return '';
	};
	const valid = FIELDS.every((field) => !errorOf(field.key));

	const saveHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const input = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
			await updateSiteSettings({ variables: { input } });
			await sweetTopSmallSuccessAlert(t('Saved') as string, 900);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<AdminPageHeader title={t('Site settings')} description={t('Shown in the footer and the help center. Leave a field empty to hide it.') as string} />
			<Box component={'form'} className={'ma-admin-card'} sx={{ maxWidth: 640 }} onSubmit={saveHandler}>
				<Stack gap={2.5}>
					{FIELDS.map((field) => (
						<TextField
							key={field.key}
							label={t(field.label)}
							placeholder={field.placeholder}
							value={form[field.key]}
							error={!!errorOf(field.key)}
							helperText={errorOf(field.key) || ' '}
							inputProps={{ maxLength: field.key === 'supportPhone' ? 30 : field.key === 'supportEmail' ? 100 : 200 }}
							onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
						/>
					))}
				</Stack>
				<Button type="submit" variant="contained" size="large" disabled={!valid || loading} sx={{ mt: 1 }}>
					{t('Save')}
				</Button>
			</Box>
		</Box>
	);
};

export default withAdminLayout(AdminSettings);
