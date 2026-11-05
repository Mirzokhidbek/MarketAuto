import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { logIn, logInWithFirebase, verifyAdminLogin } from '../../auth';
import { firebaseEnabled } from '../../firebase';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { field, fieldHint, formError } from '../ui/styles';
import { buttonClasses } from '../ui/Button';

/**
 * Shown by the admin layout instead of the panel to anyone who is not logged in as an admin:
 * password first, then the SMS code the API sends to the admin's phone.
 */
const AdminLogin = () => {
	const { t } = useTranslation('common');
	const [step, setStep] = useState<'password' | 'code'>('password');
	const [input, setInput] = useState({ nick: '', password: '', code: '' });
	const [admin, setAdmin] = useState({ nick: '', devCode: '' });
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const loggedInAsMember = !!userVar()?._id && userVar()?.memberType !== MemberType.ADMIN;

	const set = (name: keyof typeof input, value: string) => {
		setInput((prev) => ({ ...prev, [name]: value }));
		setError('');
	};

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		try {
			if (step === 'password') {
				const result = await logIn(input.nick, input.password);
				if (result.twoFactorRequired) {
					setAdmin({ nick: result.memberNick ?? input.nick, devCode: result.devCode ?? '' });
					setStep('code');
					return;
				}
			} else {
				await verifyAdminLogin(admin.nick, input.code);
			}
			// an admin account switches the layout to the panel by itself; any other account stays here
			if (userVar()?.memberType !== MemberType.ADMIN) setError(t('This account is not an admin.') as string);
		} catch (err: any) {
			setError(t(err.message) as string);
		} finally {
			setBusy(false);
		}
	};

	// admins whose Gmail is listed on the server (ADMIN_GOOGLE_EMAILS) may sign in with Google instead
	const googleLogin = async () => {
		setBusy(true);
		setError('');
		try {
			const [{ GoogleAuthProvider, signInWithPopup }, { firebaseAuth }] = await Promise.all([import('firebase/auth'), import('../../firebase')]);
			const result = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
			await logInWithFirebase(result.user);
			if (userVar()?.memberType !== MemberType.ADMIN) setError(t('This account is not an admin.') as string);
		} catch (err: any) {
			const cancelled = err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request';
			setError(t(cancelled ? 'Sign-in was cancelled' : err.message) as string);
		} finally {
			setBusy(false);
		}
	};

	const canSubmit = !busy && (step === 'password' ? input.nick.trim() !== '' && input.password !== '' : input.code.length === 6);

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#f3f5fa] px-4 font-sans text-[#0f172a]">
			<Head>
				<title>{`${t('Admin panel')} | CarPort`}</title>
				<meta name="robots" content="noindex" />
			</Head>
			<form
				onSubmit={submit}
				className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] sm:p-8"
			>
				<img src="/img/logo/logo.png" alt="CarPort" className="mb-5 block w-[150px]" />
				<h1 className="m-0 mb-1 text-xl font-semibold">{t('Admin panel')}</h1>
				<p className="m-0 mb-5 text-sm text-muted">
					{step === 'password' ? t('Log in with an admin account.') : t('Enter the code sent to the admin phone.')}
				</p>
				{loggedInAsMember && step === 'password' && (
					<p className="m-0 mb-4 rounded-lg bg-[#fff7ed] px-3 py-2 text-[13px] text-[#9a3412]">{t('This account is not an admin.')}</p>
				)}

				{step === 'password' ? (
					<>
						<label className={field}>
							<span>{t('Phone, email or nickname')}</span>
							<input type="text" autoComplete="username" autoFocus value={input.nick} onChange={(e) => set('nick', e.target.value)} />
						</label>
						<label className={field}>
							<span>{t('Password')}</span>
							<input
								type="password"
								autoComplete="current-password"
								placeholder={t('Enter password') as string}
								value={input.password}
								onChange={(e) => set('password', e.target.value)}
							/>
						</label>
					</>
				) : (
					<label className={field}>
						<span>{t('SMS code')}</span>
						<input
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
							maxLength={6}
							placeholder={'123456'}
							value={input.code}
							onChange={(e) => set('code', e.target.value.replace(/\D/g, ''))}
						/>
						{/* only in development without an SMS provider */}
						{admin.devCode && (
							<em className={fieldHint}>
								{t('Test mode code')}: {admin.devCode}
							</em>
						)}
					</label>
				)}

				{error && <p className={formError}>{error}</p>}
				<button type="submit" disabled={!canSubmit} className={buttonClasses({ className: 'mt-2 w-full' })}>
					{step === 'password' ? t('Login') : t('Confirm')}
				</button>
				{step === 'password' && firebaseEnabled && (
					<>
						<div className="my-3 flex items-center gap-3 text-xs text-muted">
							<span className="h-px flex-1 bg-line" />
							{t('or')}
							<span className="h-px flex-1 bg-line" />
						</div>
						<button
							type="button"
							disabled={busy}
							onClick={googleLogin}
							className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-line bg-white font-sans text-sm font-semibold text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
						>
							<img src={'/img/icons/google.svg'} alt={''} width={18} height={18} />
							{t('Continue with Google')}
						</button>
					</>
				)}
				<div className="mt-4 flex justify-between text-sm">
					{step === 'code' ? (
						<button
							type="button"
							className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-muted hover:text-ink"
							onClick={() => (setStep('password'), set('code', ''))}
						>
							← {t('Back')}
						</button>
					) : (
						<Link href={'/'} className="text-muted hover:text-ink">
							← {t('Home')}
						</Link>
					)}
				</div>
			</form>
		</main>
	);
};

export default AdminLogin;
