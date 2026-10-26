import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { useRouter } from 'next/router';
import { logIn, logInWithCode, resetPassword, signUp, verifyAdminLogin } from '../../libs/auth';
import { sweetMixinSuccessAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import PhoneCodeField from '../../libs/components/common/PhoneCodeField';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type View = 'login' | 'code' | 'register' | 'reset' | 'admin2fa';

const NICK_PATTERN = /^[a-zA-Z0-9_.]{3,12}$/;

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [view, setView] = useState<View>('login');
	const [input, setInput] = useState({ nick: '', password: '', phone: '', code: '', type: 'USER' });
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
				await signUp({ nick: input.nick, password: input.password, phone: input.phone, type: input.type, code: input.code });
			} else {
				await resetPassword(input.phone, input.code, input.password);
				await sweetMixinSuccessAlert(t('Password changed successfully.') as string);
			}
			await goAfterAuth();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	};

	const passwordOk = input.password.length >= 5 && input.password.length <= 12;
	const codeOk = input.code.length === 6;
	const canSubmit =
		!busy &&
		(view === 'login'
			? input.nick.trim() !== '' && input.password !== ''
			: view === 'code' || view === 'admin2fa'
			? codeOk
			: view === 'register'
			? NICK_PATTERN.test(input.nick) && passwordOk && codeOk && agreed
			: passwordOk && codeOk);

	const titles: Record<View, [string, string]> = {
		login: ['Welcome back', 'Log in to save cars and contact sellers.'],
		code: ['Log in with SMS code', 'No password needed: we send a code to your phone.'],
		register: ['Create your account', 'Confirm your phone with an SMS code — it protects buyers from fake sellers.'],
		reset: ['Reset password', 'We will send a code to the phone number of your account.'],
		admin2fa: ['Admin login confirmation', 'We sent a code to the phone number of the admin account.'],
	};

	return (
		<div className={'ma-page ma-auth'}>
			<div className={'ma-auth__card'}>
				<div className={'ma-auth__brand'}>
					<img src="/img/logo/logoWhite.svg" alt="MarketAuto" />
					<h2>{t('Buy and sell cars with confidence')}</h2>
					<ul>
						<li>{t('Cars from Uzbekistan and abroad in one place')}</li>
						<li>{t('Every seller confirms the phone number')}</li>
						<li>{t('List your car for free in a few minutes')}</li>
					</ul>
				</div>

				<form className={'ma-auth__form'} onSubmit={submitHandler}>
					{view !== 'reset' && view !== 'admin2fa' && (
						<div className={'ma-segmented'}>
							<button
								type="button"
								className={view === 'login' || view === 'code' ? 'is-active' : ''}
								onClick={() => switchView('login')}
							>
								{t('Login')}
							</button>
							<button type="button" className={view === 'register' ? 'is-active' : ''} onClick={() => switchView('register')}>
								{t('Register')}
							</button>
						</div>
					)}

					<h1>{t(titles[view][0])}</h1>
					<p className={'ma-auth__lead'}>{t(titles[view][1])}</p>

					{(view === 'login' || view === 'register') && (
						<label className={'ma-input'}>
							<span>{view === 'login' ? t('Phone or nickname') : t('Nickname')}</span>
							<input
								type="text"
								autoComplete="username"
								placeholder={(view === 'login' ? t('+998 90 123 45 67 or nickname') : t('Enter nickname')) as string}
								value={input.nick}
								onChange={(e) => set('nick', view === 'login' ? e.target.value : e.target.value.trim())}
							/>
							{view === 'register' && (
								<em className={'ma-input__hint'}>{t('3-12 latin letters, digits, "_" or "."')}</em>
							)}
						</label>
					)}

					{view === 'admin2fa' && (
						<label className={'ma-input'}>
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
								<em className={'ma-input__hint'}>
									{t('Test mode code')}: {admin.devCode}
								</em>
							)}
						</label>
					)}

					{view !== 'login' && view !== 'admin2fa' && (
						<PhoneCodeField
							purpose={view === 'register' ? 'SIGNUP' : view === 'code' ? 'LOGIN' : 'RESET_PASSWORD'}
							phone={input.phone}
							code={input.code}
							onPhoneChange={(value) => set('phone', value)}
							onCodeChange={(value) => set('code', value)}
						/>
					)}

					{view !== 'code' && view !== 'admin2fa' && (
					<label className={'ma-input'}>
						<span>{view === 'reset' ? t('New password') : t('Password')}</span>
						<input
							type="password"
							autoComplete={view === 'login' ? 'current-password' : 'new-password'}
							placeholder={(view === 'login' ? t('Enter password') : t('5-12 characters')) as string}
							maxLength={12}
							value={input.password}
							onChange={(e) => set('password', e.target.value)}
						/>
					</label>
					)}

					{view === 'login' && (
						<div className={'ma-auth__links'}>
							<button type="button" className={'ma-link-btn'} onClick={() => switchView('code')}>
								{t('Log in with SMS code')}
							</button>
							<button type="button" className={'ma-link-btn'} onClick={() => switchView('reset')}>
								{t('Forgot password?')}
							</button>
						</div>
					)}
					{view === 'code' && (
						<div className={'ma-auth__links'}>
							<button type="button" className={'ma-link-btn'} onClick={() => switchView('login')}>
								{t('Log in with password')}
							</button>
						</div>
					)}

					{view === 'register' && (
						<>
							<span className={'ma-input__label'}>{t('Account type')}</span>
							<div className={'ma-role'}>
								<button type="button" className={input.type === 'USER' ? 'is-active' : ''} onClick={() => set('type', 'USER')}>
									<strong>{t('Private seller')}</strong>
									<span>{t('Buy, sell and follow sellers')}</span>
								</button>
								<button type="button" className={input.type === 'AGENT' ? 'is-active' : ''} onClick={() => set('type', 'AGENT')}>
									<strong>{t('Dealer')}</strong>
									<span>{t('Car dealership or showroom')}</span>
								</button>
							</div>
							<label className={'ma-check ma-auth__terms'}>
								<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
								<span>
									{t('I accept the')}{' '}
									<Link href={'/terms'} target={'_blank'}>
										{t('Terms of Use')}
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

					{error && (
						<p className={'ma-field-error ma-auth__error'} role={'alert'}>
							{errorText(error)}
						</p>
					)}

					<button type="submit" className={'ma-btn ma-btn--primary ma-btn--block ma-auth__submit'} disabled={!canSubmit}>
						{view === 'admin2fa'
							? t('Confirm')
							: view === 'login' || view === 'code'
							? t('Login')
							: view === 'register'
							? t('Create account')
							: t('Save new password')}
					</button>

					<p className={'ma-auth__switch'}>
						{view === 'reset' || view === 'admin2fa' ? (
							<button type="button" className={'ma-link-btn'} onClick={() => switchView('login')}>
								← {t('Back to login')}
							</button>
						) : (
							<>
								{view === 'register' ? t('Already have an account?') : t("Don't have an account?")}{' '}
								<button
									type="button"
									className={'ma-link-btn'}
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
