import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: 'USER' });
	const [loginView, setLoginView] = useState<boolean>(true);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			const isAdmin = userVar()?.memberType === MemberType.ADMIN;
			await router.push(isAdmin ? '/_admin' : `${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input]);

	const doSignUp = useCallback(async () => {
		try {
			await signUp(input.nick, input.password, input.phone, input.type);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input]);

	const submitHandler = (e: React.FormEvent) => {
		e.preventDefault();
		if (loginView) doLogin();
		else doSignUp();
	};

	const canSubmit = loginView
		? input.nick !== '' && input.password !== ''
		: input.nick !== '' && input.password !== '' && input.phone !== '';

	return (
		<div className={'ma-page ma-auth'}>
			<div className={'ma-auth__card'}>
				<div className={'ma-auth__brand'}>
					<img src="/img/logo/logoWhite.svg" alt="MarketAuto" />
					<h2>{t('Buy and sell cars with confidence')}</h2>
					<ul>
						<li>{t('Cars from Uzbekistan and abroad in one place')}</li>
						<li>{t('Contact sellers directly — no middlemen')}</li>
						<li>{t('List your car for free in a few minutes')}</li>
					</ul>
				</div>

				<form className={'ma-auth__form'} onSubmit={submitHandler}>
					<div className={'ma-segmented'}>
						<button type="button" className={loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(true)}>
							{t('Login')}
						</button>
						<button type="button" className={!loginView ? 'is-active' : ''} onClick={() => viewChangeHandler(false)}>
							{t('Register')}
						</button>
					</div>

					<h1>{loginView ? t('Welcome back') : t('Create your account')}</h1>
					<p className={'ma-auth__lead'}>
						{loginView ? t('Log in to save cars and contact sellers.') : t('Join MarketAuto in less than a minute.')}
					</p>

					<label className={'ma-input'}>
						<span>{t('Nickname')}</span>
						<input
							type="text"
							autoComplete="username"
							placeholder={t('Enter nickname') as string}
							onChange={(e) => handleInput('nick', e.target.value)}
							required
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Password')}</span>
						<input
							type="password"
							autoComplete={loginView ? 'current-password' : 'new-password'}
							placeholder={t('Enter password') as string}
							onChange={(e) => handleInput('password', e.target.value)}
							required
						/>
					</label>

					{!loginView && (
						<>
							<label className={'ma-input'}>
								<span>{t('Phone')}</span>
								<input
									type="tel"
									autoComplete="tel"
									placeholder={'998901234567'}
									onChange={(e) => handleInput('phone', e.target.value)}
									required
								/>
							</label>
							<span className={'ma-input__label'}>{t('Account type')}</span>
							<div className={'ma-role'}>
								<button
									type="button"
									className={input.type === 'USER' ? 'is-active' : ''}
									onClick={() => handleInput('type', 'USER')}
								>
									<strong>{t('Private seller')}</strong>
									<span>{t('Buy, sell and follow sellers')}</span>
								</button>
								<button
									type="button"
									className={input.type === 'AGENT' ? 'is-active' : ''}
									onClick={() => handleInput('type', 'AGENT')}
								>
									<strong>{t('Dealer')}</strong>
									<span>{t('Car dealership or showroom')}</span>
								</button>
							</div>
						</>
					)}

					<button
						type="submit"
						className={'ma-btn ma-btn--primary ma-btn--block ma-auth__submit'}
						disabled={!canSubmit}
					>
						{loginView ? t('Login') : t('Create account')}
					</button>

					<p className={'ma-auth__switch'}>
						{loginView ? t("Don't have an account?") : t('Already have an account?')}{' '}
						<button type="button" className={'ma-link-btn'} onClick={() => viewChangeHandler(!loginView)}>
							{loginView ? t('Register') : t('Login')}
						</button>
					</p>
				</form>
			</div>
		</div>
	);
};

export default withLayoutFull(Join);
