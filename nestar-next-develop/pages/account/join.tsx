import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { useRouter } from 'next/router';
import { logIn, resetPassword, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../libs/sweetAlert';
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

type View = 'login' | 'register' | 'reset';

const NICK_PATTERN = /^[a-zA-Z0-9_.]{3,12}$/;

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [view, setView] = useState<View>('login');
	const [input, setInput] = useState({ nick: '', password: '', phone: '', code: '', type: 'USER' });
	const [agreed, setAgreed] = useState<boolean>(false);
	const [busy, setBusy] = useState<boolean>(false);

	const set = (name: keyof typeof input, value: string) => setInput((prev) => ({ ...prev, [name]: value }));
	const goAfterAuth = async () => {
		const isAdmin = userVar()?.memberType === MemberType.ADMIN;
		await router.push(isAdmin ? '/_admin' : `${router.query.referrer ?? '/'}`);
	};

	const submitHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		try {
			if (view === 'login') {
				await logIn(input.nick, input.password);
			} else if (view === 'register') {
				await signUp({ nick: input.nick, password: input.password, phone: input.phone, type: input.type, code: input.code });
			} else {
				await resetPassword(input.phone, input.code, input.password);
				await sweetMixinSuccessAlert(t('Password changed successfully.') as string);
			}
			await goAfterAuth();
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setBusy(false);
		}
	};

	const passwordOk = input.password.length >= 5 && input.password.length <= 12;
	const codeOk = input.code.length === 6;
	const canSubmit =
		!busy &&
		(view === 'login'
			? input.nick !== '' && input.password !== ''
			: view === 'register'
			? NICK_PATTERN.test(input.nick) && passwordOk && codeOk && agreed
			: passwordOk && codeOk);

	const titles: Record<View, [string, string]> = {
		login: ['Welcome back', 'Log in to save cars and contact sellers.'],
		register: ['Create your account', 'Confirm your phone with an SMS code — it protects buyers from fake sellers.'],
		reset: ['Reset password', 'We will send a code to the phone number of your account.'],
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
					{view !== 'reset' && (
						<div className={'ma-segmented'}>
							<button type="button" className={view === 'login' ? 'is-active' : ''} onClick={() => setView('login')}>
								{t('Login')}
							</button>
							<button type="button" className={view === 'register' ? 'is-active' : ''} onClick={() => setView('register')}>
								{t('Register')}
							</button>
						</div>
					)}

					<h1>{t(titles[view][0])}</h1>
					<p className={'ma-auth__lead'}>{t(titles[view][1])}</p>

					{view !== 'reset' && (
						<label className={'ma-input'}>
							<span>{t('Nickname')}</span>
							<input
								type="text"
								autoComplete="username"
								placeholder={t('Enter nickname') as string}
								value={input.nick}
								onChange={(e) => set('nick', e.target.value.trim())}
							/>
							{view === 'register' && (
								<em className={'ma-input__hint'}>{t('3-12 latin letters, digits, "_" or "."')}</em>
							)}
						</label>
					)}

					{view !== 'login' && (
						<PhoneCodeField
							purpose={view === 'register' ? 'SIGNUP' : 'RESET_PASSWORD'}
							phone={input.phone}
							code={input.code}
							onPhoneChange={(value) => set('phone', value)}
							onCodeChange={(value) => set('code', value)}
						/>
					)}

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

					{view === 'login' && (
						<button type="button" className={'ma-link-btn ma-auth__forgot'} onClick={() => setView('reset')}>
							{t('Forgot password?')}
						</button>
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
								</span>
							</label>
						</>
					)}

					<button type="submit" className={'ma-btn ma-btn--primary ma-btn--block ma-auth__submit'} disabled={!canSubmit}>
						{view === 'login' ? t('Login') : view === 'register' ? t('Create account') : t('Save new password')}
					</button>

					<p className={'ma-auth__switch'}>
						{view === 'reset' ? (
							<button type="button" className={'ma-link-btn'} onClick={() => setView('login')}>
								← {t('Back to login')}
							</button>
						) : (
							<>
								{view === 'login' ? t("Don't have an account?") : t('Already have an account?')}{' '}
								<button
									type="button"
									className={'ma-link-btn'}
									onClick={() => setView(view === 'login' ? 'register' : 'login')}
								>
									{view === 'login' ? t('Register') : t('Login')}
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
