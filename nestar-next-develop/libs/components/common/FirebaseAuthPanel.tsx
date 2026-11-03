import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next/pages';
import {
	ConfirmationResult,
	GoogleAuthProvider,
	RecaptchaVerifier,
	createUserWithEmailAndPassword,
	sendEmailVerification,
	signInWithEmailAndPassword,
	signInWithPhoneNumber,
	signInWithPopup,
	signOut,
} from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../../firebase';
import { logInWithFirebase } from '../../auth';
import { EMAIL_PATTERN } from './EmailCodeField';
import PasswordRules from './PasswordRules';
import { isStrongPassword, PASSWORD_MAX } from '../../password';
import { field, formError, linkButton } from '../ui/styles';
import { buttonClasses } from '../ui/Button';

/** "Continue with Google / phone / email"; the open one is outlined in blue */
const provider = (open: boolean) =>
	buttonClasses({ variant: 'outline', block: true, className: open ? 'mt-2.5 gap-2.5 border-primary! text-primary!' : 'mt-2.5 gap-2.5' });
const methodPanel = 'flex flex-col gap-2.5 rounded-[10px] border border-line bg-surface p-3.5';

type Method = 'email' | 'phone' | null;

interface FirebaseAuthPanelProps {
	mode: 'login' | 'register';
	/** USER or AGENT, used only when a new account is created */
	memberType?: string;
	/** registration: the terms must be accepted before any button works */
	canStart: boolean;
	onDone: () => Promise<void>;
}

/** Firebase error codes → texts the visitor understands */
const firebaseErrorText = (code: string): string => {
	switch (code) {
		case 'auth/invalid-credential':
		case 'auth/wrong-password':
		case 'auth/user-not-found':
		case 'auth/invalid-email':
			return 'Wrong email or password';
		case 'auth/email-already-in-use':
			return 'This email is already registered';
		case 'auth/too-many-requests':
		case 'auth/quota-exceeded':
			return 'Too many attempts. Try again later.';
		case 'auth/invalid-phone-number':
		case 'auth/missing-phone-number':
			return 'Invalid phone number';
		case 'auth/invalid-verification-code':
		case 'auth/code-expired':
			return 'Wrong SMS code';
		case 'auth/popup-closed-by-user':
		case 'auth/cancelled-popup-request':
			return 'Sign-in was cancelled';
		case 'auth/operation-not-allowed':
		case 'auth/billing-not-enabled':
			return 'Phone sign-in is not available yet';
		default:
			return 'Something went wrong. Try again.';
	}
};

/** Uzbek numbers may be typed without the country code: 90 123 45 67 → +998901234567 */
const toE164 = (phone: string): string => {
	const digits = phone.replace(/\D/g, '');
	return `+${digits.length === 9 ? `998${digits}` : digits}`;
};

/**
 * Sign-in with Firebase Authentication: Google, phone (SMS code) and email + password.
 * After Firebase confirms the person, the API turns it into a normal CarPort session.
 */
const FirebaseAuthPanel = ({ mode, memberType, canStart, onDone }: FirebaseAuthPanelProps) => {
	const { t } = useTranslation('common');
	const [method, setMethod] = useState<Method>(null);
	const [form, setForm] = useState({ email: '', password: '', phone: '', code: '' });
	const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
	const [busy, setBusy] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [info, setInfo] = useState<string>('');
	const recaptcha = useRef<RecaptchaVerifier | null>(null);

	// the invisible reCAPTCHA belongs to this page only
	useEffect(() => () => recaptcha.current?.clear(), []);
	// switching between "Login" and "Register" starts over
	useEffect(() => {
		setMethod(null);
		setConfirmation(null);
		setError('');
		setInfo('');
	}, [mode]);

	if (!firebaseEnabled) return null;

	const set = (name: keyof typeof form, value: string) => {
		setForm((prev) => ({ ...prev, [name]: value }));
		setError('');
	};
	const choose = (next: Method) => {
		setMethod(method === next ? null : next);
		setConfirmation(null);
		setError('');
		setInfo('');
	};

	// runs a Firebase step; API messages (blocked, admin, ...) arrive as plain messages, Firebase ones as codes
	const run = async (step: () => Promise<void>) => {
		if (!canStart) return setError('Accept the terms to continue');
		setBusy(true);
		setError('');
		try {
			await step();
		} catch (err: any) {
			setError(err?.code?.startsWith?.('auth/') ? firebaseErrorText(err.code) : err?.message ?? 'Something went wrong. Try again.');
		} finally {
			setBusy(false);
		}
	};

	const finish = async (user: Parameters<typeof logInWithFirebase>[0]) => {
		await logInWithFirebase(user, mode === 'register' ? memberType : undefined);
		await onDone();
	};

	const googleHandler = () =>
		run(async () => {
			const result = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
			await finish(result.user);
		});

	const emailHandler = () =>
		run(async () => {
			const auth = firebaseAuth();
			const email = form.email.trim().toLowerCase();
			if (mode === 'register') {
				const { user } = await createUserWithEmailAndPassword(auth, email, form.password);
				await sendEmailVerification(user);
				await signOut(auth);
				setInfo(t('We sent a confirmation link to {{email}}. Open it, then log in here.', { email }) as string);
				return;
			}
			const { user } = await signInWithEmailAndPassword(auth, email, form.password);
			// the API accepts only confirmed addresses: send the link again and wait for the click
			if (!user.emailVerified) {
				await sendEmailVerification(user).catch(() => undefined);
				await signOut(auth);
				setInfo(t('We sent a confirmation link to {{email}}. Open it, then log in here.', { email }) as string);
				return;
			}
			await finish(user);
		});

	const sendCodeHandler = () =>
		run(async () => {
			const auth = firebaseAuth();
			recaptcha.current?.clear();
			recaptcha.current = new RecaptchaVerifier(auth, 'ma-firebase-recaptcha', { size: 'invisible' });
			try {
				setConfirmation(await signInWithPhoneNumber(auth, toE164(form.phone), recaptcha.current));
				set('code', '');
			} catch (err) {
				recaptcha.current?.clear();
				recaptcha.current = null;
				throw err;
			}
		});

	const confirmCodeHandler = () =>
		run(async () => {
			if (!confirmation) return;
			const { user } = await confirmation.confirm(form.code);
			await finish(user);
		});

	// Enter inside these fields must not submit the page's own login form
	const onEnter = (action: () => void) => (e: React.KeyboardEvent) => {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		action();
	};

	const emailReady =
		EMAIL_PATTERN.test(form.email.trim()) &&
		(mode === 'register' ? isStrongPassword(form.password, undefined, form.email) : form.password.length > 0);
	const phoneReady = form.phone.replace(/\D/g, '').length >= 9;

	return (
		<div className="mb-1 flex flex-col gap-2.5 font-sans">
			<button type="button" className={provider(false)} onClick={googleHandler} disabled={busy}>
				<img src={'/img/icons/google.svg'} alt={''} width={18} height={18} />
				{t('Continue with Google')}
			</button>

			<button
				type="button"
				className={provider(method === 'phone')}
				aria-expanded={method === 'phone'}
				onClick={() => choose('phone')}
			>
				{t('Continue with phone')}
			</button>
			{method === 'phone' && (
				<div className={methodPanel}>
					{!confirmation ? (
						<>
							<label className={`${field} mb-0!`}>
								<span>{t('Phone number')}</span>
								<input
									type="tel"
									inputMode="tel"
									autoComplete="tel"
									placeholder={'+998 90 123 45 67'}
									value={form.phone}
									onChange={(e) => set('phone', e.target.value)}
									onKeyDown={onEnter(() => phoneReady && !busy && sendCodeHandler())}
								/>
							</label>
							<button
								type="button"
								className={buttonClasses({ block: true, className: 'mt-2.5' })}
								onClick={sendCodeHandler}
								disabled={!phoneReady || busy}
							>
								{t('Send code')}
							</button>
						</>
					) : (
						<>
							<label className={`${field} mb-0!`}>
								<span>{t('SMS code')}</span>
								<input
									type="text"
									inputMode="numeric"
									autoComplete="one-time-code"
									autoFocus
									maxLength={6}
									placeholder={'123456'}
									value={form.code}
									onChange={(e) => set('code', e.target.value.replace(/\D/g, ''))}
									onKeyDown={onEnter(() => form.code.length === 6 && !busy && confirmCodeHandler())}
								/>
							</label>
							<button
								type="button"
								className={buttonClasses({ block: true, className: 'mt-2.5' })}
								onClick={confirmCodeHandler}
								disabled={form.code.length !== 6 || busy}
							>
								{t('Confirm')}
							</button>
							<button type="button" className={`${linkButton} self-center`} onClick={() => setConfirmation(null)}>
								{t('Change number')}
							</button>
						</>
					)}
				</div>
			)}

			<button
				type="button"
				className={provider(method === 'email')}
				aria-expanded={method === 'email'}
				onClick={() => choose('email')}
			>
				{t('Continue with email')}
			</button>
			{method === 'email' && (
				<div className={methodPanel}>
					<label className={`${field} mb-0!`}>
						<span>{t('Email')}</span>
						<input
							type="email"
							autoComplete="email"
							placeholder={'name@example.com'}
							value={form.email}
							onChange={(e) => set('email', e.target.value)}
						/>
					</label>
					<label className={`${field} mb-0!`}>
						<span>{t('Password')}</span>
						<input
							type="password"
							autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
							placeholder={(mode === 'login' ? t('Enter password') : t('At least 8 characters')) as string}
							maxLength={PASSWORD_MAX}
							value={form.password}
							onChange={(e) => set('password', e.target.value)}
							onKeyDown={onEnter(() => emailReady && !busy && emailHandler())}
						/>
						{mode === 'register' && <PasswordRules password={form.password} email={form.email} />}
					</label>
					<button type="button" className={buttonClasses({ block: true, className: 'mt-2.5' })} onClick={emailHandler} disabled={!emailReady || busy}>
						{mode === 'login' ? t('Login') : t('Create account')}
					</button>
				</div>
			)}

			{info && (
				<p className="m-0 rounded-md bg-[#e6efff] px-3 py-2.5 text-sm leading-[1.45] text-ink" role={'status'}>
					{info}
				</p>
			)}
			{error && (
				<p className={formError} role={'alert'}>
					{t(error)}
				</p>
			)}
			{/* the invisible reCAPTCHA Firebase needs before sending an SMS */}
			<div id={'ma-firebase-recaptcha'} />

			<div className="mt-1.5 mb-0.5 flex items-center gap-3 text-[13px] text-faint before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
				<span>{t('or')}</span>
			</div>
		</div>
	);
};

export default FirebaseAuthPanel;
