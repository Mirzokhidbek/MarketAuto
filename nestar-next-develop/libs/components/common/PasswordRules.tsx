import React from 'react';
import { useTranslation } from 'next-i18next/pages';
import { passwordChecks } from '../../password';
import { CheckCircleIcon, RadioUncheckedIcon as RadioButtonUncheckedIcon } from '../ui/icons';

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
		<ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0" aria-live={'polite'}>
			{rules.map(([ok, label]) => (
				<li key={label} className={`inline-flex items-center gap-1 text-xs [&_svg]:text-sm ${ok && password ? 'text-[#127a46]' : 'text-muted'}`}>
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
