/** the API's password rules (apps/nestar-api/src/libs/password.ts), checked while typing */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export interface PasswordChecks {
	length: boolean;
	lettersAndDigits: boolean;
	notPersonal: boolean;
}

export const passwordChecks = (password: string, nick?: string, email?: string): PasswordChecks => {
	const lower = password.toLowerCase();
	const personal = [nick, email?.split('@')[0]].filter((v): v is string => !!v && v.length >= 3);
	return {
		length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
		lettersAndDigits: /[A-Za-zЀ-ӿ]/.test(password) && /\d/.test(password),
		notPersonal: !personal.some((value) => lower.includes(value.toLowerCase())),
	};
};

export const isStrongPassword = (password: string, nick?: string, email?: string): boolean =>
	Object.values(passwordChecks(password, nick, email)).every(Boolean);
