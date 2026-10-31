import React from 'react';
import { useTranslation } from 'next-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { passwordChecks } from '../../password';

/** live checklist under a new-password field; common passwords are refused by the server */
const PasswordRules = ({ password, nick, email }: { password: string; nick?: string; email?: string }) => {
	const { t } = useTranslation('common');
	const checks = passwordChecks(password, nick, email);
	const rules: [boolean, string][] = [
		[checks.length, 'At least 8 characters'],
		[checks.lettersAndDigits, 'Letters and digits'],
		[checks.notPersonal || !password, 'Not your nickname or email'],
	];
	return (
		<ul className={'ma-pass-rules'} aria-live={'polite'}>
			{rules.map(([ok, label]) => (
				<li key={label} className={ok && password ? 'is-ok' : ''}>
					{ok && password ? (
						<CheckCircleIcon fontSize={'inherit'} />
					) : (
						<RadioButtonUncheckedIcon fontSize={'inherit'} />
					)}
					{t(label)}
				</li>
			))}
		</ul>
	);
};

export default PasswordRules;
