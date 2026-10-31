/**
 * Password rules for new passwords (signup, change, reset). Existing shorter passwords still log in;
 * they are replaced the next time the member changes or resets the password.
 */
export const PASSWORD_MIN = 8;
// bcrypt reads only the first 72 bytes
export const PASSWORD_MAX = 64;

// the most used passwords (and the ones people type for this site); checked in lower case
const COMMON = new Set([
	'12345678',
	'123456789',
	'1234567890',
	'11111111',
	'00000000',
	'87654321',
	'password',
	'password1',
	'password123',
	'qwerty123',
	'qwertyuiop',
	'1q2w3e4r',
	'1qaz2wsx',
	'abc12345',
	'abcd1234',
	'iloveyou1',
	'admin123',
	'parol123',
	'uzbekistan1',
	'toshkent1',
	'tashkent1',
	'carport1',
	'carport123',
	'marketauto1',
]);

/** null when the password is acceptable, otherwise why not (a stable code the client translates) */
export const passwordProblem = (password: string, nick?: string, email?: string): string | null => {
	if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return 'LENGTH';
	if (!/[A-Za-zЀ-ӿ]/.test(password) || !/\d/.test(password)) return 'LETTERS_AND_DIGITS';
	const lower = password.toLowerCase();
	if (COMMON.has(lower) || /^(.)\1+$/.test(password)) return 'COMMON';
	const personal = [nick, email?.split('@')[0]].filter((v): v is string => !!v && v.length >= 3);
	if (personal.some((value) => lower.includes(value.toLowerCase()))) return 'PERSONAL';
	return null;
};
