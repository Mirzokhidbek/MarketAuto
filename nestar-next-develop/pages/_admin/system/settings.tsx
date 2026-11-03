import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client/react';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_SITE_SETTINGS } from '../../../apollo/user/query';
import { UPDATE_SITE_SETTINGS } from '../../../apollo/admin/mutation';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { cx } from '../../../libs/components/ui/classNames';
import { AdminCard, AdminField, adminButton, adminInput } from '../../../libs/components/admin/ui';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

type Settings = Record<'supportPhone' | 'supportEmail' | 'telegramUrl' | 'instagramUrl' | 'facebookUrl', string>;
const EMPTY: Settings = { supportPhone: '', supportEmail: '', telegramUrl: '', instagramUrl: '', facebookUrl: '' };

const FIELDS: { key: keyof Settings; label: string; placeholder: string }[] = [
	{ key: 'supportPhone', label: 'Support phone', placeholder: '+998 71 200 00 00' },
	{ key: 'supportEmail', label: 'Support email', placeholder: 'support@marketauto.uz' },
	{ key: 'telegramUrl', label: 'Telegram', placeholder: 'https://t.me/carport' },
	{ key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/carport' },
	{ key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/carport' },
];

const isUrl = (value: string) => !value || /^https:\/\/[^\s]+$/.test(value);
const isEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value: string) => !value || /^\+?[\d\s()-]{7,20}$/.test(value);

/** contacts shown in the footer and the help center; empty fields fall back to the defaults */
const AdminSettings: NextPage = () => {
	const { t } = useTranslation('common');
	const [form, setForm] = useState<Settings>(EMPTY);
	const { data } = useQuery<any>(GET_SITE_SETTINGS, { fetchPolicy: 'network-only' });
	const [updateSiteSettings, { loading }] = useMutation<any>(UPDATE_SITE_SETTINGS, { refetchQueries: [GET_SITE_SETTINGS] });

	useEffect(() => {
		const saved = data?.getSiteSettings;
		if (saved) setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, saved[key] ?? ''])) as Settings);
	}, [data]);

	const errorOf = (key: keyof Settings): string => {
		const value = form[key].trim();
		if (key.endsWith('Url') && !isUrl(value)) return t('Link must start with https://') as string;
		if (key === 'supportEmail' && !isEmail(value)) return t('Enter a valid email') as string;
		if (key === 'supportPhone' && !isPhone(value)) return t('Enter a valid phone number') as string;
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
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader title={t('Site settings')} description={t('Shown in the footer and the help center. Leave a field empty to hide it.') as string} />
			<AdminCard className="max-w-[640px]">
				<form onSubmit={saveHandler}>
					{/* the name sits above each field (not inside it), so it stays readable while typing and spacing is even */}
					<div className="flex flex-col gap-4">
						{FIELDS.map((field) => (
							<AdminField
								key={field.key}
								label={t(field.label)}
								hint={errorOf(field.key) ? <span className="text-[#c5221f]">{errorOf(field.key)}</span> : undefined}
							>
								<input
									className={cx(adminInput, !!errorOf(field.key) && 'border-[#e5484d]')}
									placeholder={field.placeholder}
									value={form[field.key]}
									maxLength={field.key === 'supportPhone' ? 30 : field.key === 'supportEmail' ? 100 : 200}
									onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
								/>
							</AdminField>
						))}
					</div>
					<button type="submit" className={adminButton({ className: 'mt-6 h-12 px-6' })} disabled={!valid || loading}>
						{t('Save')}
					</button>
				</form>
			</AdminCard>
		</div>
	);
};

export default withAdminLayout(AdminSettings);
