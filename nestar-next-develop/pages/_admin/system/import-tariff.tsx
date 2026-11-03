import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import { useTranslation } from 'next-i18next/pages';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useMutation, useQuery } from '@apollo/client/react';
import moment from 'moment';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import AdminPageHeader from '../../../libs/components/admin/AdminPageHeader';
import { GET_IMPORT_TARIFF } from '../../../apollo/admin/query';
import { UPDATE_IMPORT_TARIFF } from '../../../apollo/admin/mutation';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { DeleteIcon as DeleteOutlineIcon, AddIcon } from '../../../libs/components/ui/icons';
import { cx } from '../../../libs/components/ui/classNames';
import { AdminCard, AdminField, adminButton, adminInput } from '../../../libs/components/admin/ui';

const tariffRow = 'grid items-end gap-3 border-b border-ink/6 py-3';
const removeButton =
	'col-span-full inline-flex size-10 cursor-pointer items-center justify-center justify-self-end rounded-full border-0 bg-transparent text-muted hover:bg-[#fde8e7] hover:text-[#c5221f] disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent md:col-span-1';

export const getStaticProps = async ({ locale }: any) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});

// every value is kept as typed text while editing; empty limit = "any"
type Cell = string;
interface DutyRow {
	maxAgeYears: Cell;
	maxEngineCc: Cell;
	percent: Cell;
	usdPerCc: Cell;
	excisePercent: Cell;
}
interface UtilRow {
	group: string;
	maxAgeYears: Cell;
	maxEngineCc: Cell;
	baseAmounts: Cell;
}
interface ShipRow {
	country: string;
	costUsd: Cell;
	days: Cell;
}
interface Form {
	vatPercent: Cell;
	electricDutyPercent: Cell;
	baseAmountUzs: Cell;
	clearanceUsd: Cell;
	defaultEngineCc: Cell;
	duty: DutyRow[];
	utilization: UtilRow[];
	shipping: ShipRow[];
}

const COUNTRIES = ['SOUTH_KOREA', 'CHINA', 'JAPAN', 'USA', 'GERMANY', 'UAE', 'OTHER'];
const COUNTRY_LABELS: Record<string, string> = {
	SOUTH_KOREA: 'South Korea',
	CHINA: 'China',
	JAPAN: 'Japan',
	USA: 'USA',
	GERMANY: 'Germany',
	UAE: 'UAE',
	OTHER: 'Other',
};
const GENERAL: { key: keyof Form; label: string; hint: string }[] = [
	{ key: 'vatPercent', label: 'VAT, %', hint: 'Of customs value + duty + excise' },
	{ key: 'electricDutyPercent', label: 'Electric car duty, %', hint: 'Of the customs value' },
	{ key: 'baseAmountUzs', label: "Base amount (BHM), so'm", hint: 'Unit of the utilization fee' },
	{ key: 'clearanceUsd', label: 'Clearance and registration, $', hint: 'Broker, certificate, number plates' },
	{ key: 'defaultEngineCc', label: 'Engine when not given, cm³', hint: 'Used for listings without engine volume' },
];

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const isNum = (v: string) => v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const isLimit = (v: string) => v.trim() === '' || (Number.isInteger(Number(v)) && Number(v) >= 0);
const num = (v: string) => Number(v);
const limit = (v: string) => (v.trim() === '' ? null : Number(v));

/** rules for "Import cost to Uzbekistan" on every car abroad; a save applies to all cars at once */
const AdminImportTariff: NextPage = () => {
	const { t } = useTranslation('common');
	const [form, setForm] = useState<Form | null>(null);
	const { data } = useQuery<any>(GET_IMPORT_TARIFF, { fetchPolicy: 'network-only' });
	const [updateImportTariff, { loading }] = useMutation<any>(UPDATE_IMPORT_TARIFF, { refetchQueries: [GET_IMPORT_TARIFF] });
	const saved = data?.getImportTariff;

	useEffect(() => {
		if (!saved) return;
		setForm({
			vatPercent: text(saved.vatPercent),
			electricDutyPercent: text(saved.electricDutyPercent),
			baseAmountUzs: text(saved.baseAmountUzs),
			clearanceUsd: text(saved.clearanceUsd),
			defaultEngineCc: text(saved.defaultEngineCc),
			duty: saved.duty.map((r: any) => ({
				maxAgeYears: text(r.maxAgeYears),
				maxEngineCc: text(r.maxEngineCc),
				percent: text(r.percent),
				usdPerCc: text(r.usdPerCc),
				excisePercent: text(r.excisePercent),
			})),
			utilization: saved.utilization.map((r: any) => ({
				group: r.group,
				maxAgeYears: text(r.maxAgeYears),
				maxEngineCc: text(r.maxEngineCc),
				baseAmounts: text(r.baseAmounts),
			})),
			// every country gets a row, so a missing one is visible and can be filled in
			shipping: COUNTRIES.map((country) => {
				const row = saved.shipping.find((r: any) => r.country === country);
				return { country, costUsd: text(row?.costUsd ?? 0), days: text(row?.days ?? 0) };
			}),
		});
	}, [saved]);

	if (!form) return null;

	const generalValid = GENERAL.every(({ key }) => isNum(form[key] as string));
	const dutyValid =
		form.duty.length > 0 &&
		form.duty.every(
			(r) =>
				isLimit(r.maxAgeYears) &&
				isLimit(r.maxEngineCc) &&
				isNum(r.percent) &&
				isNum(r.usdPerCc) &&
				isNum(r.excisePercent),
		);
	const utilValid =
		form.utilization.length > 0 &&
		form.utilization.every((r) => isLimit(r.maxAgeYears) && isLimit(r.maxEngineCc) && isNum(r.baseAmounts));
	const shipValid = form.shipping.every((r) => isNum(r.costUsd) && isLimit(r.days) && r.days.trim() !== '');
	const valid = generalValid && dutyValid && utilValid && shipValid;

	const setRow = <K extends 'duty' | 'utilization' | 'shipping'>(
		list: K,
		index: number,
		patch: Partial<Form[K][number]>,
	) => setForm({ ...form, [list]: form[list].map((row, i) => (i === index ? { ...row, ...patch } : row)) });
	const removeRow = (list: 'duty' | 'utilization', index: number) =>
		setForm({ ...form, [list]: (form[list] as any[]).filter((_, i) => i !== index) });

	const field = (label: string, value: string, onChange: (v: string) => void, ok: boolean, placeholder?: string) => (
		<AdminField label={t(label)}>
			<input
				className={cx(adminInput, 'h-10', !ok && 'border-[#e5484d]')}
				value={value}
				inputMode="decimal"
				placeholder={placeholder ? (t(placeholder) as string) : undefined}
				onChange={(e) => onChange(e.target.value.replace(',', '.'))}
			/>
		</AdminField>
	);

	const saveHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const input = {
				vatPercent: num(form.vatPercent),
				electricDutyPercent: num(form.electricDutyPercent),
				baseAmountUzs: num(form.baseAmountUzs),
				clearanceUsd: num(form.clearanceUsd),
				defaultEngineCc: Math.round(num(form.defaultEngineCc)),
				duty: form.duty.map((r) => ({
					maxAgeYears: limit(r.maxAgeYears),
					maxEngineCc: limit(r.maxEngineCc),
					percent: num(r.percent),
					usdPerCc: num(r.usdPerCc),
					excisePercent: num(r.excisePercent),
				})),
				utilization: form.utilization.map((r) => ({
					group: r.group,
					maxAgeYears: limit(r.maxAgeYears),
					maxEngineCc: limit(r.maxEngineCc),
					baseAmounts: num(r.baseAmounts),
				})),
				shipping: form.shipping.map((r) => ({ country: r.country, costUsd: num(r.costUsd), days: num(r.days) })),
			};
			await updateImportTariff({ variables: { input } });
			await sweetTopSmallSuccessAlert(t('Saved') as string, 900);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className="mx-auto w-full max-w-[1440px]">
			<AdminPageHeader
				title={t('Import tariff')}
				description={
					t('Rules for "Import cost to Uzbekistan" on every car abroad. A save applies to all cars at once.') as string
				}
			/>
			<form className="flex max-w-[1040px] flex-col gap-5" onSubmit={saveHandler}>
				<p className="m-0 text-sm text-[#475569]">
					{saved?.updatedAt
						? `${t('Last saved')}: ${moment(saved.updatedAt).format('DD.MM.YYYY HH:mm')}`
						: t('Starting values are used. Check them against the official rates and save.')}
				</p>

				<AdminCard>
					<h2 className="m-0 mb-1 text-lg font-bold text-[#0f172a]">{t('General')}</h2>
					<div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
						{GENERAL.map((g) => (
							<AdminField key={g.key} label={t(g.label)} hint={t(g.hint)}>
								<input
									className={cx(adminInput, 'h-10', !isNum(form[g.key] as string) && 'border-[#e5484d]')}
									value={form[g.key] as string}
									inputMode="decimal"
									onChange={(e) => setForm({ ...form, [g.key]: e.target.value.replace(',', '.') })}
								/>
							</AdminField>
						))}
					</div>
				</AdminCard>

				<AdminCard>
					<h2 className="m-0 mb-1 text-lg font-bold text-[#0f172a]">{t('Customs duty and excise')}</h2>
					<p className="m-0 mb-4 text-[13px] text-[#475569]">
						{t(
							'Petrol, diesel, gas and hybrid cars. The first row that fits the car is used, so go from the narrowest to the widest. Empty limit = any.',
						)}
					</p>
					{form.duty.map((r, i) => (
						<div key={i} className={cx(tariffRow, 'grid-cols-2 md:grid-cols-[repeat(5,minmax(0,1fr))_40px]')}>
							{field(
								'Age up to, years',
								r.maxAgeYears,
								(v) => setRow('duty', i, { maxAgeYears: v }),
								isLimit(r.maxAgeYears),
								'any',
							)}
							{field(
								'Engine up to, cm³',
								r.maxEngineCc,
								(v) => setRow('duty', i, { maxEngineCc: v }),
								isLimit(r.maxEngineCc),
								'any',
							)}
							{field('Duty, %', r.percent, (v) => setRow('duty', i, { percent: v }), isNum(r.percent))}
							{field('Plus $ per cm³', r.usdPerCc, (v) => setRow('duty', i, { usdPerCc: v }), isNum(r.usdPerCc))}
							{field(
								'Excise, %',
								r.excisePercent,
								(v) => setRow('duty', i, { excisePercent: v }),
								isNum(r.excisePercent),
							)}
							<button
								type="button"
								className={removeButton}
								title={t('Remove row') as string}
								aria-label={t('Remove row') as string}
								disabled={form.duty.length < 2}
								onClick={() => removeRow('duty', i)}
							>
								<DeleteOutlineIcon />
							</button>
						</div>
					))}
					<button
						type="button"
						className={adminButton({ variant: 'text', color: 'primary', className: 'mt-3 self-start' })}
						disabled={form.duty.length >= 30}
						onClick={() =>
							setForm({
								...form,
								duty: [
									...form.duty,
									{ maxAgeYears: '', maxEngineCc: '', percent: '0', usdPerCc: '0', excisePercent: '0' },
								],
							})
						}
					>
						<AddIcon /> {t('Add row')}
					</button>
				</AdminCard>

				<AdminCard>
					<h2 className="m-0 mb-1 text-lg font-bold text-[#0f172a]">{t('Utilization fee')}</h2>
					<p className="m-0 mb-4 text-[13px] text-[#475569]">
						{t('In base amounts (BHM). The first row of the car group that fits is used.')}
					</p>
					{form.utilization.map((r, i) => (
						<div key={i} className={cx(tariffRow, 'grid-cols-2 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_40px]')}>
							<AdminField label={t('Cars')} className="col-span-2 md:col-span-1">
								<select className={cx(adminInput, 'h-10 cursor-pointer')} value={r.group} onChange={(e) => setRow('utilization', i, { group: e.target.value })}>
									<option value={'COMBUSTION'}>{t('Petrol, diesel, gas, hybrid')}</option>
									<option value={'ELECTRIC'}>{t('Electric')}</option>
								</select>
							</AdminField>
							{field(
								'Age up to, years',
								r.maxAgeYears,
								(v) => setRow('utilization', i, { maxAgeYears: v }),
								isLimit(r.maxAgeYears),
								'any',
							)}
							{field(
								'Engine up to, cm³',
								r.maxEngineCc,
								(v) => setRow('utilization', i, { maxEngineCc: v }),
								isLimit(r.maxEngineCc),
								'any',
							)}
							{field('BHM', r.baseAmounts, (v) => setRow('utilization', i, { baseAmounts: v }), isNum(r.baseAmounts))}
							<button
								type="button"
								className={removeButton}
								title={t('Remove row') as string}
								aria-label={t('Remove row') as string}
								disabled={form.utilization.length < 2}
								onClick={() => removeRow('utilization', i)}
							>
								<DeleteOutlineIcon />
							</button>
						</div>
					))}
					<button
						type="button"
						className={adminButton({ variant: 'text', color: 'primary', className: 'mt-3 self-start' })}
						disabled={form.utilization.length >= 30}
						onClick={() =>
							setForm({
								...form,
								utilization: [
									...form.utilization,
									{ group: 'COMBUSTION', maxAgeYears: '', maxEngineCc: '', baseAmounts: '0' },
								],
							})
						}
					>
						<AddIcon /> {t('Add row')}
					</button>
				</AdminCard>

				<AdminCard>
					<h2 className="m-0 mb-1 text-lg font-bold text-[#0f172a]">{t('Delivery by country')}</h2>
					<p className="m-0 mb-4 text-[13px] text-[#475569]">{t('Used when the seller did not give a delivery cost.')}</p>
					{form.shipping.map((r, i) => (
						<div key={r.country} className={cx(tariffRow, 'grid-cols-2 md:grid-cols-[minmax(0,1fr)_160px_120px]')}>
							<strong className="col-span-full self-center font-semibold md:col-span-1">{t(COUNTRY_LABELS[r.country])}</strong>
							{field('Cost, $', r.costUsd, (v) => setRow('shipping', i, { costUsd: v }), isNum(r.costUsd))}
							{field(
								'Days',
								r.days,
								(v) => setRow('shipping', i, { days: v }),
								isLimit(r.days) && r.days.trim() !== '',
							)}
						</div>
					))}
				</AdminCard>

				<div className="sticky bottom-0 z-[2] flex items-center justify-end gap-4 bg-[linear-gradient(to_top,#f3f5fa_70%,transparent)] py-3.5">
					{!valid && <span className="text-sm text-[#c62828]">{t('Fix the fields marked in red.')}</span>}
					<button type="submit" className={adminButton({ className: 'h-12 px-6' })} disabled={!valid || loading}>
						{t('Save')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default withAdminLayout(AdminImportTariff);
