import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation } from '@apollo/client';
import { REQUEST_EMAIL_CODE } from '../../../apollo/user/mutation';
import { sweetErrorHandling } from '../../sweetAlert';

type Purpose = 'SIGNUP' | 'RESET_PASSWORD' | 'VERIFY_EMAIL';

interface EmailCodeFieldProps {
	purpose: Purpose;
	email: string;
	code: string;
	onEmailChange: (email: string) => void;
	onCodeChange: (code: string) => void;
	emailLabel?: string;
}

const RESEND_SECONDS = 60;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** email + "Send code" button + 6-digit code input (the same flow as PhoneCodeField) */
const EmailCodeField = ({ purpose, email, code, onEmailChange, onCodeChange, emailLabel }: EmailCodeFieldProps) => {
	const { t } = useTranslation('common');
	const [requestEmailCode, { loading }] = useMutation(REQUEST_EMAIL_CODE);
	const [cooldown, setCooldown] = useState<number>(0);
	const [sent, setSent] = useState<boolean>(false);
	const [devCode, setDevCode] = useState<string>('');

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	const valid = EMAIL_PATTERN.test(email.trim());
	const canSend = valid && cooldown === 0 && !loading;

	const sendHandler = async () => {
		try {
			const { data } = await requestEmailCode({ variables: { input: { email: email.trim(), purpose } } });
			setSent(true);
			setCooldown(RESEND_SECONDS);
			setDevCode(data?.requestEmailCode?.devCode ?? '');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<>
			<label className={'ma-input'}>
				<span>{emailLabel ?? t('Email')}</span>
				<div className={'ma-code-row'}>
					<input
						type="email"
						autoComplete="email"
						inputMode="email"
						placeholder={'name@mail.uz'}
						value={email}
						onChange={(e) => onEmailChange(e.target.value.trim())}
					/>
					<button type="button" className={'ma-btn ma-btn--outline'} disabled={!canSend} onClick={sendHandler}>
						{cooldown > 0 ? `${cooldown}s` : sent ? t('Resend code') : t('Send code')}
					</button>
				</div>
				<em className={'ma-input__hint'}>
					{sent
						? t('We sent a 6-digit code. Check the Spam folder too.')
						: t('We will send a 6-digit code to this address.')}
				</em>
			</label>
			{sent && (
				<label className={'ma-input'}>
					<span>{t('Code from the email')}</span>
					<input
						type="text"
						inputMode="numeric"
						autoComplete="one-time-code"
						maxLength={6}
						placeholder={'123456'}
						value={code}
						onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
					/>
					{/* only in development without an SMTP server */}
					{devCode && (
						<em className={'ma-input__hint'}>
							{t('Test mode code')}: {devCode}
						</em>
					)}
				</label>
			)}
		</>
	);
};

export default EmailCodeField;
