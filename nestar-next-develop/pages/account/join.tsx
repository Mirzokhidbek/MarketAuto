import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { useRouter } from 'next/router';
import { logIn, logInWithCode, resetPassword, signUp, signUpWithEmail, verifyAdminLogin } from '../../libs/auth';
import { sweetMixinSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import { useTranslation } from 'next-i18next/pages';
import PhoneCodeField from '../../libs/components/common/PhoneCodeField';
import EmailCodeField, { EMAIL_PATTERN } from '../../libs/components/common/EmailCodeField';
import PasswordRules from '../../libs/components/common/PasswordRules';
import FirebaseAuthPanel from '../../libs/components/common/FirebaseAuthPanel';
import { isStrongPassword, PASSWORD_MAX } from '../../libs/password';
import { isInsideTelegram, telegramSignIn } from '../../libs/hooks/useTelegramMiniApp';
import { field, fieldHint, fieldLabel, formError, linkButton, segmentButton, segmented } from '../../libs/components/ui/styles';
import { buttonClasses } from '../../libs/components/ui/Button';
import { Spinner } from '../../libs/components/ui/Feedback';
import { cx } from '../../libs/components/ui/classNames';

const authPage = 'flex min-h-[calc(100vh-72px)] items-center justify-center px-4 pt-24 pb-12 font-sans sm:px-6 sm:pt-28 sm:pb-16';
const roleCard = (active: boolean) =>
	cx(
		'flex cursor-pointer flex-col items-start gap-1 rounded-xl border-[1.5px] p-3.5 text-left font-sans',
		active ? 'border-primary bg-[#eff6ff]' : 'border-line bg-white',
	);
const channelTab = (active: boolean) =>
	cx(
		'-mb-px cursor-pointer border-0 border-b-2 bg-transparent py-2 font-sans text-sm font-semibold',
		active ? 'border-primary text-ink' : 'border-transparent text-muted',
	);

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type View = 'login' | 'code' | 'register' | 'reset' | 'admin2fa';
/** registration and password reset work with a phone (SMS code) or an email (code by email) */
type Channel = 'phone' | 'email';

const NICK_PATTERN = /^[a-zA-Z0-9_.]{3,12}$/;

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [view, setView] = useState<View>('login');
	const [input, setInput] = useState({ nick: '', password: '', phone: '', email: '', code: '', type: 'USER' });
	const [channel, setChannel] = useState<Channel>('phone');
	const [agreed, setAgreed] = useState<boolean>(false);
	const [busy, setBusy] = useState<boolean>(false);
	// errors are shown inside the form, next to the button, not in a popup
	const [error, setError] = useState<string>('');
	// admin second step: the nick confirmed by the password step and the dev-mode code hint
	const [admin, setAdmin] = useState<{ nick: string; devCode: string }>({ nick: '', devCode: '' });
	const switchView = (next: View) => {
		setView(next);
		setError('');
	};
	const switchChannel = (next: Channel) => {
		setChannel(next);
		setInput((prev) => ({ ...prev, code: '' }));
		setError('');
	};

	const set = (name: keyof typeof input, value: string) => {
		setInput((prev) => ({ ...prev, [name]: value }));
		setError('');
	};
	// a blocked member gets the fixed message + the admin's reason
	const BLOCKED = 'You have been blocked!';
	const errorText = (message: string) => {
		const reason = message.startsWith(BLOCKED) ? message.slice(BLOCKED.length).trim() : '';
		return reason ? `${t(BLOCKED)} ${t('Reason')}: ${reason}` : t(message);
	};

	const goAfterAuth = async () => {
		const isAdmin = userVar()?.memberType === MemberType.ADMIN;
		const referrer = typeof router.query.referrer === 'string' ? router.query.referrer : '';
		// only same-site paths; an admin always lands in the admin panel
		const safeReferrer = referrer.startsWith('/') && !referrer.startsWith('//') ? referrer : '/';
		await router.push(isAdmin ? (safeReferrer.startsWith('/_admin') ? safeReferrer : '/_admin') : safeReferrer);
	};

	// inside the Telegram Mini App the bot's /start already registered the person: sign in with Telegram, no form
	const [telegram, setTelegram] = useState<'checking' | 'failed' | null>(null);
	useEffect(() => {
		// the referrer (where to go afterwards) is in router.query only once the router is ready
		if (!router.isReady || !isInsideTelegram()) return;
		setTelegram('checking');
		telegramSignIn().then((ok) => {
			if (ok) return goAfterAuth();
			setTelegram('failed');
			setError(t('Could not sign in with Telegram. Open the bot and press /start, then try again.') as string);
		});
	}, [router.isReady]);

	const submitHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		try {
			if (view === 'login') {
				const result = await logIn(input.nick, input.password);
				if (result.twoFactorRequired) {
					setAdmin({ nick: result.memberNick ?? input.nick, devCode: result.devCode ?? '' });
					setInput((prev) => ({ ...prev, code: '' }));
					setView('admin2fa');
					return;
				}
			} else if (view === 'admin2fa') {
				await verifyAdminLogin(admin.nick, input.code);
			} else if (view === 'code') {
				await logInWithCode(input.phone, input.code);
			} else if (view === 'register') {
				const account = { nick: input.nick, password: input.password, type: input.type, code: input.code };
				if (channel === 'email') await signUpWithEmail({ ...account, email: input.email });
				else await signUp({ ...account, phone: input.phone });
			} else {
				await resetPassword(channel === 'email' ? { email: input.email } : { phone: input.phone }, input.code, input.password);
				await sweetMixinSuccessAlert(t('Password changed successfully.') as string);
			}
			await goAfterAuth();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};

	// new passwords follow the server rules; the login form takes any password (old accounts may have short ones)
	const passwordOk = isStrongPassword(input.password, view === 'register' ? input.nick : undefined, channel === 'email' ? input.email : undefined);
	const targetOk = channel === 'email' ? EMAIL_PATTERN.test(input.email) : input.phone.replace(/\D/g, '').length >= 9;
	const codeOk = input.code.length === 6;
	const canSubmit =
		!busy &&
		(view === 'login'
			? input.nick.trim() !== '' && input.password !== ''
			: view === 'code' || view === 'admin2fa'
			? codeOk
			: view === 'register'
			? NICK_PATTERN.test(input.nick) && passwordOk && targetOk && codeOk && agreed
			: passwordOk && targetOk && codeOk);

	const titles: Record<View, [string, string]> = {
		login: ['Welcome back', 'Log in to save cars and contact sellers.'],
		code: ['Log in with SMS code', 'No password needed: we send a code to your phone.'],
		register: [
			'Create your account',
			channel === 'email'
				? 'Confirm your email with a code. To list a car you will also confirm a phone number.'
				: 'Confirm your phone with an SMS code — it protects buyers from fake sellers.',
		],
		reset: [
			'Reset password',
			channel === 'email'
				? 'We will send a code to the email of your account.'
				: 'We will send a code to the phone number of your account.',
		],
		admin2fa: ['Admin login confirmation', 'We sent a code to the phone number of the admin account.'],
	};

	if (telegram === 'checking')
		return (
			<div className={authPage}>
				<div className="flex flex-col items-center gap-4 text-[15px] text-muted">
					<Spinner size={36} />
					<p>{t('Signing in with Telegram…')}</p>
				</div>
			</div>
		);

	return (
		<div className={authPage}>
			<div className="grid w-[1000px] max-w-full grid-cols-1 overflow-hidden rounded-[14px] border border-line bg-white font-sans md:grid-cols-2">
				<div className="hidden flex-col justify-center bg-ink p-12 text-white md:flex">
					<img src="/img/logo/logo-white.png" alt="CarPort" className="mb-10 w-60" />
					<h2 className="m-0 mb-6 text-[30px] leading-[1.25] font-bold">{t('Buy and sell cars with confidence')}</h2>
					<ul className="m-0 list-none p-0 [&>li]:relative [&>li]:mb-3.5 [&>li]:pl-[30px] [&>li]:text-[15px] [&>li]:text-white/80 [&>li]:before:absolute [&>li]:before:top-[-1px] [&>li]:before:left-0 [&>li]:before:flex [&>li]:before:size-5 [&>li]:before:items-center [&>li]:before:justify-center [&>li]:before:rounded-full [&>li]:before:bg-white/15 [&>li]:before:text-xs [&>li]:before:content-['✓']">
						<li>{t('Cars from Uzbekistan and abroad in one place')}</li>
						<li>{t('Every seller confirms the phone number')}</li>
						<li>{t('List your car for free in a few minutes')}</li>
					</ul>
				</div>

				<form className="flex min-w-0 flex-col px-[22px] py-7 sm:px-12 sm:py-11" onSubmit={submitHandler}>
					{view !== 'reset' && view !== 'admin2fa' && (
						<div className={segmented}>
							<button
								type="button"
								className={segmentButton(view === 'login' || view === 'code')}
								onClick={() => switchView('login')}
							>
								{t('Login')}
							</button>
							<button type="button" className={segmentButton(view === 'register')} onClick={() => switchView('register')}>
								{t('Register')}
							</button>
						</div>
					)}

					<h1 className="m-0 mt-7 mb-1.5 text-[26px] font-bold text-ink">{t(titles[view][0])}</h1>
					<p className="m-0 mb-6 text-sm text-muted">{t(titles[view][1])}</p>

					{/* registration: account type and terms first, they apply to every sign-up method */}
					{view === 'register' && (
						<>
							<span className={fieldLabel}>{t('Account type')}</span>
							<div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
								<button type="button" className={roleCard(input.type === 'USER')} onClick={() => set('type', 'USER')}>
									<strong className="text-sm text-ink">{t('Private seller')}</strong>
									<span className="text-xs text-muted">{t('Buy, sell and follow sellers')}</span>
								</button>
								<button type="button" className={roleCard(input.type === 'AGENT')} onClick={() => set('type', 'AGENT')}>
									<strong className="text-sm text-ink">{t('Dealer')}</strong>
									<span className="text-xs text-muted">{t('Car dealership or showroom')}</span>
								</button>
							</div>
							<label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1.5 text-[13px] leading-normal text-text hover:bg-surface [&_a]:text-primary [&_a]:underline">
								<input type="checkbox" className="size-4 shrink-0 cursor-pointer accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
								<span>
									{t('I accept the')}{' '}
									<Link href={'/terms'} target={'_blank'}>
										{t('Terms of Use')}
									</Link>
									,{' '}
									<Link href={'/offer'} target={'_blank'}>
										{t('Public Offer')}
									</Link>{' '}
									{t('and')}{' '}
									<Link href={'/privacy'} target={'_blank'}>
										{t('Privacy Policy')}
									</Link>
									{t('terms_suffix')}
								</span>
							</label>
						</>
					)}

					{/* Firebase: Google, phone and email sign-in; the classic nickname form follows below */}
					{(view === 'login' || view === 'register') && (
						<FirebaseAuthPanel
							mode={view}
							memberType={input.type}
							canStart={view === 'login' || agreed}
							onDone={goAfterAuth}
						/>
					)}

					{(view === 'register' || view === 'reset') && (
						<div className="mb-[18px] flex gap-5 border-b border-line" role={'tablist'} aria-label={t('Confirm with') as string}>
							<button
								type="button"
								role={'tab'}
								aria-selected={channel === 'phone'}
								className={channelTab(channel === 'phone')}
								onClick={() => switchChannel('phone')}
							>
								{t('With phone')}
							</button>
							<button
								type="button"
								role={'tab'}
								aria-selected={channel === 'email'}
								className={channelTab(channel === 'email')}
								onClick={() => switchChannel('email')}
							>
								{t('With email')}
							</button>
						</div>
					)}

					{(view === 'login' || view === 'register') && (
						<label className={field}>
							<span>{view === 'login' ? t('Phone, email or nickname') : t('Nickname')}</span>
							<input
								type="text"
								autoComplete="username"
								placeholder={(view === 'login' ? t('+998 90 123 45 67, email or nickname') : t('Enter nickname')) as string}
								value={input.nick}
								onChange={(e) => set('nick', view === 'login' ? e.target.value : e.target.value.trim())}
							/>
							{view === 'register' && (
								<em className={fieldHint}>{t('3-12 latin letters, digits, "_" or "."')}</em>
							)}
						</label>
					)}

					{view === 'admin2fa' && (
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

					{view !== 'login' && view !== 'admin2fa' && (view === 'code' || channel === 'phone') && (
						<PhoneCodeField
							key={view}
							purpose={view === 'register' ? 'SIGNUP' : view === 'code' ? 'LOGIN' : 'RESET_PASSWORD'}
							phone={input.phone}
							code={input.code}
							onPhoneChange={(value) => set('phone', value)}
							onCodeChange={(value) => set('code', value)}
						/>
					)}
					{(view === 'register' || view === 'reset') && channel === 'email' && (
						<EmailCodeField
							key={view}
							purpose={view === 'register' ? 'SIGNUP' : 'RESET_PASSWORD'}
							email={input.email}
							code={input.code}
							onEmailChange={(value) => set('email', value)}
							onCodeChange={(value) => set('code', value)}
						/>
					)}

					{view !== 'code' && view !== 'admin2fa' && (
					<label className={field}>
						<span>{view === 'reset' ? t('New password') : t('Password')}</span>
						<input
							type="password"
							autoComplete={view === 'login' ? 'current-password' : 'new-password'}
							placeholder={(view === 'login' ? t('Enter password') : t('At least 8 characters')) as string}
							maxLength={PASSWORD_MAX}
							value={input.password}
							onChange={(e) => set('password', e.target.value)}
						/>
						{view !== 'login' && (
							<PasswordRules
								password={input.password}
								nick={view === 'register' ? input.nick : undefined}
								email={channel === 'email' ? input.email : undefined}
							/>
						)}
					</label>
					)}

					{view === 'login' && (
						<div className="-mt-1 mb-2 flex justify-between gap-3">
							<button type="button" className={linkButton} onClick={() => switchView('code')}>
								{t('Log in with SMS code')}
							</button>
							<button type="button" className={linkButton} onClick={() => switchView('reset')}>
								{t('Forgot password?')}
							</button>
						</div>
					)}
					{view === 'code' && (
						<div className="-mt-1 mb-2 flex justify-between gap-3">
							<button type="button" className={linkButton} onClick={() => switchView('login')}>
								{t('Log in with password')}
							</button>
						</div>
					)}

					{error && (
						<p className={`${formError} rounded-[10px] bg-[#fce8e6] px-3 py-2.5`} role={'alert'}>
							{errorText(error)}
						</p>
					)}

					<button type="submit" className={buttonClasses({ block: true, className: 'mt-2 h-12!' })} disabled={!canSubmit}>
						{view === 'admin2fa'
							? t('Confirm')
							: view === 'login' || view === 'code'
							? t('Login')
							: view === 'register'
							? t('Create account')
							: t('Save new password')}
					</button>

					<p className="m-0 mt-5 text-center text-sm text-muted [&_button]:text-sm">
						{view === 'reset' || view === 'admin2fa' ? (
							<button type="button" className={linkButton} onClick={() => switchView('login')}>
								← {t('Back to login')}
							</button>
						) : (
							<>
								{view === 'register' ? t('Already have an account?') : t("Don't have an account?")}{' '}
								<button
									type="button"
									className={linkButton}
									onClick={() => switchView(view === 'register' ? 'login' : 'register')}
								>
									{view === 'register' ? t('Login') : t('Register')}
								</button>
							</>
						)}
					</p>
				</form>
			</div>
		</div>
	);
};

export default withLayoutFull(Join);
