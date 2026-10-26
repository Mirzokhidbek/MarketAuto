import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';

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
		<Dialog open={open} onClose={onClose} fullWidth maxWidth={'sm'}>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				{description && (
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						{description}
					</Typography>
				)}
				{presets.length > 0 && (
					<Stack direction={'row'} flexWrap={'wrap'} gap={1} sx={{ mb: 2 }}>
						{presets.map((preset) => (
							<Chip
								key={preset}
								label={t(preset)}
								variant={text === t(preset) ? 'filled' : 'outlined'}
								color={text === t(preset) ? 'primary' : 'default'}
								onClick={() => setReason(t(preset) as string)}
							/>
						))}
					</Stack>
				)}
				<TextField
					autoFocus
					fullWidth
					multiline
					minRows={3}
					label={t('Reason')}
					value={reason}
					inputProps={{ maxLength: 300 }}
					helperText={`${text.length}/300`}
					onChange={(e) => setReason(e.target.value)}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose}>{t('Cancel')}</Button>
				<Button variant="contained" color="error" disabled={!valid} onClick={() => onConfirm(text)}>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ReasonDialog;
