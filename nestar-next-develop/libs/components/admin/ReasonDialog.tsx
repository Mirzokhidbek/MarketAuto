import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import Dialog from '../ui/Dialog';
import { AdminField, adminButton, adminTextarea, chip } from './ui';

interface ReasonDialogProps {
	open: boolean;
	title: string;
	description?: string;
	/** ready-made reasons (translation keys); a click puts the translated text into the field */
	presets?: string[];
	confirmLabel: string;
	onConfirm: (reason: string) => void;
	onClose: () => void;
}

/** asks the admin why: the reason is stored and shown to the member (block, listing rejection) */
const ReasonDialog = ({ open, title, description, presets = [], confirmLabel, onConfirm, onClose }: ReasonDialogProps) => {
	const { t } = useTranslation('common');
	const [reason, setReason] = useState<string>('');

	useEffect(() => {
		if (open) setReason('');
	}, [open]);

	const text = reason.trim();
	const valid = text.length >= 2 && text.length <= 300;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			actions={
				<>
					<button className={adminButton({ variant: 'text' })} onClick={onClose}>
						{t('Cancel')}
					</button>
					<button className={adminButton({ color: 'error' })} disabled={!valid} onClick={() => onConfirm(text)}>
						{confirmLabel}
					</button>
				</>
			}
		>
			{description && <p className="m-0 mb-4 text-sm text-muted">{description}</p>}
			{presets.length > 0 && (
				<div className="mb-4 flex flex-wrap gap-2">
					{presets.map((preset) => (
						<button key={preset} type="button" className={chip(text === t(preset))} onClick={() => setReason(t(preset) as string)}>
							{t(preset)}
						</button>
					))}
				</div>
			)}
			<AdminField label={t('Reason')} hint={`${text.length}/300`}>
				<textarea autoFocus rows={3} maxLength={300} className={adminTextarea} value={reason} onChange={(e) => setReason(e.target.value)} />
			</AdminField>
		</Dialog>
	);
};

export default ReasonDialog;
