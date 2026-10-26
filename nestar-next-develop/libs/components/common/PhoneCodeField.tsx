import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation } from '@apollo/client';
import { REQUEST_PHONE_CODE } from '../../../apollo/user/mutation';
import { sweetErrorHandling } from '../../sweetAlert';

type Purpose = 'SIGNUP' | 'RESET_PASSWORD' | 'CHANGE_PHONE' | 'LOGIN';

interface PhoneCodeFieldProps {
	purpose: Purpose;
	phone: string;
	code: string;
	onPhoneChange: (phone: string) => void;
	onCodeChange: (code: string) => void;
	phoneLabel?: string;
}

const RESEND_SECONDS = 60;

/**
 * Phone number + "Send code" button + 6-digit SMS code input.
 * Foreign numbers must start with their country code (e.g. 82 for Korea).
 */
const PhoneCodeField = ({ purpose, phone, code, onPhoneChange, onCodeChange, phoneLabel }: PhoneCodeFieldProps) => {
	const { t } = useTranslation('common');
	const [requestPhoneCode, { loading }] = useMutation(REQUEST_PHONE_CODE);
	const [cooldown, setCooldown] = useState<number>(0);
	const [sent, setSent] = useState<boolean>(false);
	const [devCode, setDevCode] = useState<string>('');

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	const digits = phone.replace(/\D/g, '');
	const canSend = digits.length >= 9 && cooldown === 0 && !loading;

	const sendHandler = async () => {
		try {
			const { data } = await requestPhoneCode({ variables: { input: { phone, purpose } } });
			setSent(true);
			setCooldown(RESEND_SECONDS);
			setDevCode(data?.requestPhoneCode?.devCode ?? '');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<>
			<label className={'ma-input'}>
				<span>{phoneLabel ?? t('Phone')}</span>
				<div className={'ma-code-row'}>
					<input
						type="tel"
						autoComplete="tel"
						placeholder={'+998 90 123 45 67'}
						value={phone}
						onChange={(e) => onPhoneChange(e.target.value)}
					/>
					<button type="button" className={'ma-btn ma-btn--outline'} disabled={!canSend} onClick={sendHandler}>
						{cooldown > 0 ? `${cooldown}s` : sent ? t('Resend code') : t('Send code')}
					</button>
				</div>
				<em className={'ma-input__hint'}>{t('With country code: 998 for Uzbekistan, 82 for Korea, 86 for China...')}</em>
			</label>
			{sent && (
				<label className={'ma-input'}>
					<span>{t('SMS code')}</span>
					<input
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						placeholder={'123456'}
						value={code}
						onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
					/>
					{/* only in development without an SMS provider */}
					{devCode && <em className={'ma-input__hint'}>{t('Test mode code')}: {devCode}</em>}
				</label>
			)}
		</>
	);
};

export default PhoneCodeField;
