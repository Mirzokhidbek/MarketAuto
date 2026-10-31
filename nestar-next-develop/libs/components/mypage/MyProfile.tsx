import { uploadImage as uploadFile } from '../../upload';
import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import { Messages, REACT_APP_API_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { CHANGE_EMAIL, CHANGE_PASSWORD, CHANGE_PHONE, UPDATE_MEMBER } from '../../../apollo/user/mutation';
import PhoneCodeField from '../common/PhoneCodeField';
import EmailCodeField from '../common/EmailCodeField';
import PasswordRules from '../common/PasswordRules';
import MySessions from './MySessions';
import { isStrongPassword, PASSWORD_MAX } from '../../password';
import { formatPhone, imageUrl } from '../../utils';

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const { t } = useTranslation('common');
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);
	const [changePassword] = useMutation(CHANGE_PASSWORD);
	const [changePhone] = useMutation(CHANGE_PHONE);
	const [changeEmail] = useMutation(CHANGE_EMAIL);
	const [phoneEdit, setPhoneEdit] = useState<boolean>(false);
	const [newPhone, setNewPhone] = useState({ phone: '', code: '' });
	const [emailEdit, setEmailEdit] = useState<boolean>(false);
	const [newEmail, setNewEmail] = useState({ email: '', code: '' });

	const changeEmailHandler = async () => {
		try {
			const result = await changeEmail({ variables: { input: newEmail } });
			const saved = result.data?.changeEmail;
			userVar({ ...userVar(), memberEmail: saved?.memberEmail ?? '', memberEmailVerified: !!saved?.memberEmailVerified });
			setEmailEdit(false);
			setNewEmail({ email: '', code: '' });
			await sweetMixinSuccessAlert(t('Email confirmed.') as string);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const changePhoneHandler = async () => {
		try {
			const result = await changePhone({ variables: { input: newPhone } });
			const jwtToken = result.data?.changePhone?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			setPhoneEdit(false);
			setNewPhone({ phone: '', code: '' });
			await sweetMixinSuccessAlert(t('Phone number updated.') as string);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};
	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

	/** LIFECYCLES **/
	useEffect(() => {
		setUpdateData({
			...updateData,
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberAddress: user.memberAddress,
			memberImage: user.memberImage,
			memberFullName: user.memberFullName,
			memberDesc: user.memberDesc,
		});
	}, [user]);

	/** HANDLERS **/
	const uploadImage = async (e: any) => {
		const file: File | undefined = e.target.files?.[0];
		if (!file) return;
		try {
			const memberImage = await uploadFile(file, 'member');
			setUpdateData((prev: MemberUpdate) => ({ ...prev, memberImage }));
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const updatePropertyHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			updateData._id = user._id;
			// optional text fields are sent only when filled (backend validates their length)
			const input: any = { ...updateData };
			['memberImage', 'memberAddress', 'memberFullName', 'memberDesc'].forEach((key) => {
				if (!input[key]) delete input[key];
			});
			delete input.memberPhone; // changed separately with an SMS code
			const result = await updateMember({
				variables: {
					input,
				},
			});

			// @ts-ignore
			const jwtToken = result.data.updateMember?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(result.data.updateMember?.accessToken);
			await sweetMixinSuccessAlert(t('Profile updated successfully.') as string);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [updateData]);

	const passwordMismatch = !!passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword;
	const canChangePassword =
		passwords.currentPassword.length > 0 &&
		isStrongPassword(passwords.newPassword, user.memberNick, user.memberEmail) &&
		passwords.newPassword !== passwords.currentPassword &&
		passwords.newPassword === passwords.confirmPassword;

	const changePasswordHandler = async () => {
		try {
			const result = await changePassword({
				variables: {
					input: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
				},
			});
			const jwtToken = result.data?.changePassword?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(jwtToken);
			setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
			await sweetMixinSuccessAlert(t('Password changed successfully.') as string);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const doDisabledCheck = () => {
		if (!updateData.memberNick) {
			return true;
		}
	};

	return (
		<div className={'ma-account-panel'}>
			<div className={'ma-account-panel__head'}>
				<div>
					<h1>{t('My Profile')}</h1>
					<p>{t('This information is shown on your public seller profile.')}</p>
				</div>
			</div>

			<div className={'ma-avatar-upload'}>
				<img
					src={
						updateData?.memberImage ? imageUrl(updateData?.memberImage) : '/img/profile/defaultUser.svg'
					}
					alt={''}
				/>
				<div>
					<label className={'ma-btn ma-btn--outline'}>
						{t('Upload photo')}
						<input type="file" hidden onChange={uploadImage} accept="image/jpg, image/jpeg, image/png" />
					</label>
					<span>{t('JPG or PNG, square image works best.')}</span>
				</div>
			</div>

			{phoneEdit && (
				<div className={'ma-panel ma-phone-change'}>
					<PhoneCodeField
						purpose={'CHANGE_PHONE'}
						phoneLabel={t('New phone number') as string}
						phone={newPhone.phone}
						code={newPhone.code}
						onPhoneChange={(phone) => setNewPhone({ ...newPhone, phone })}
						onCodeChange={(code) => setNewPhone({ ...newPhone, code })}
					/>
					<button
						className={'ma-btn ma-btn--primary'}
						disabled={newPhone.code.length !== 6}
						onClick={changePhoneHandler}
					>
						{t('Confirm new phone')}
					</button>
				</div>
			)}

			{emailEdit && (
				<div className={'ma-panel ma-phone-change'}>
					<EmailCodeField
						purpose={'VERIFY_EMAIL'}
						emailLabel={(user.memberEmail ? t('New email') : t('Email')) as string}
						email={newEmail.email}
						code={newEmail.code}
						onEmailChange={(email) => setNewEmail({ ...newEmail, email })}
						onCodeChange={(code) => setNewEmail({ ...newEmail, code })}
					/>
					<button className={'ma-btn ma-btn--primary'} disabled={newEmail.code.length !== 6} onClick={changeEmailHandler}>
						{t('Confirm email')}
					</button>
				</div>
			)}

			<div className={'ma-form-grid'}>
				<label className={'ma-input'}>
					<span>{t('Nickname')}</span>
					<input
						type="text"
						placeholder={t('Enter nickname') as string}
						value={updateData.memberNick ?? ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
					/>
				</label>
				<label className={'ma-input'}>
					<span>{t('Full name')}</span>
					<input
						type="text"
						placeholder={t('Full name / company name') as string}
						value={updateData.memberFullName || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberFullName: value })}
					/>
				</label>
				<label className={'ma-input'}>
					<span>{t('Phone')}</span>
					{/* the phone is changed only with an SMS code to the new number */}
					<div className={'ma-code-row'}>
						<input
							type="tel"
							value={user.memberPhone ? formatPhone(user.memberPhone) : ''}
							placeholder={t('Not added') as string}
							readOnly
						/>
						<button type="button" className={'ma-btn ma-btn--outline'} onClick={() => setPhoneEdit(!phoneEdit)}>
							{phoneEdit ? t('Cancel') : user.memberPhone ? t('Change') : t('Add')}
						</button>
					</div>
					<em className={'ma-input__hint'}>
						{user.memberPhone && user.memberPhoneVerified
							? `✓ ${t('Phone confirmed')}`
							: t('A confirmed phone is needed to list a car.')}
					</em>
				</label>
				<label className={'ma-input'}>
					<span>{t('Email')}</span>
					{/* changed only with the code sent to the new address; never shown to other members */}
					<div className={'ma-code-row'}>
						<input type="email" value={user.memberEmail ?? ''} placeholder={t('Not added') as string} readOnly />
						<button type="button" className={'ma-btn ma-btn--outline'} onClick={() => setEmailEdit(!emailEdit)}>
							{emailEdit ? t('Cancel') : user.memberEmail ? t('Change') : t('Add')}
						</button>
					</div>
					<em className={'ma-input__hint'}>
						{user.memberEmail && user.memberEmailVerified
							? `✓ ${t('Email confirmed')} · ${t('only you can see it')}`
							: t('Used to log in, reset the password and receive security alerts.')}
					</em>
				</label>
				<label className={'ma-input'}>
					<span>{t('Address')}</span>
					<input
						type="text"
						placeholder={t('e.g. Tashkent, Chilonzor') as string}
						value={updateData.memberAddress ?? ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
					/>
				</label>
			</div>
			<label className={'ma-input'}>
				<span>{t('About')}</span>
				<textarea
					placeholder={t('Tell buyers about you or your dealership') as string}
					value={updateData.memberDesc ?? ''}
					onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberDesc: value })}
				></textarea>
			</label>
			<div className={'ma-form-actions'}>
				<button className={'ma-btn ma-btn--primary'} onClick={updatePropertyHandler} disabled={doDisabledCheck()}>
					{t('Save changes')}
				</button>
			</div>

			<section className={'ma-form-section ma-password'}>
				<h2>{t('Change password')}</h2>
				<div className={'ma-form-grid'}>
					<label className={'ma-input'}>
						<span>{t('Current password')}</span>
						<input
							type="password"
							autoComplete="current-password"
							value={passwords.currentPassword}
							onChange={({ target: { value } }) => setPasswords({ ...passwords, currentPassword: value })}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('New password')}</span>
						<input
							type="password"
							autoComplete="new-password"
							maxLength={PASSWORD_MAX}
							placeholder={t('At least 8 characters') as string}
							value={passwords.newPassword}
							onChange={({ target: { value } }) => setPasswords({ ...passwords, newPassword: value })}
						/>
						<PasswordRules password={passwords.newPassword} nick={user.memberNick} email={user.memberEmail} />
					</label>
					<label className={'ma-input'}>
						<span>{t('Confirm new password')}</span>
						<input
							type="password"
							autoComplete="new-password"
							maxLength={PASSWORD_MAX}
							value={passwords.confirmPassword}
							onChange={({ target: { value } }) => setPasswords({ ...passwords, confirmPassword: value })}
						/>
						{passwordMismatch && <em className={'ma-input__error'}>{t('Passwords do not match')}</em>}
					</label>
				</div>
				<div className={'ma-form-actions'}>
					<button className={'ma-btn ma-btn--primary'} onClick={changePasswordHandler} disabled={!canChangePassword}>
						{t('Change password')}
					</button>
				</div>
				<p className={'ma-input__hint'}>{t('After a password change you are logged out on every other device.')}</p>
			</section>

			<MySessions />
		</div>
	);
};

MyProfile.defaultProps = {
	initialValues: {
		_id: '',
		memberImage: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
		memberFullName: '',
		memberDesc: '',
	},
};

export default MyProfile;
