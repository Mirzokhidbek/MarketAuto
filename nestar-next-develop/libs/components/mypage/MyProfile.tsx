import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useTranslation } from 'next-i18next';
import axios from 'axios';
import { Messages, REACT_APP_API_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { CHANGE_PASSWORD, CHANGE_PHONE, UPDATE_MEMBER } from '../../../apollo/user/mutation';
import PhoneCodeField from '../common/PhoneCodeField';
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
	const [phoneEdit, setPhoneEdit] = useState<boolean>(false);
	const [newPhone, setNewPhone] = useState({ phone: '', code: '' });

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
		try {
			const image = e.target.files[0];

			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'member',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			updateData.memberImage = responseImage;
			setUpdateData({ ...updateData });

			return imageUrl(responseImage);
		} catch (err) {
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
		passwords.currentPassword.length >= 5 &&
		passwords.newPassword.length >= 5 &&
		passwords.newPassword.length <= 12 &&
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

			<div className={'ma-form-grid'}>
				<label className={'ma-input'}>
					<span>{t('Nickname')}</span>
					<input
						type="text"
						placeholder={'nickname'}
						value={updateData.memberNick ?? ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
					/>
				</label>
				<label className={'ma-input'}>
					<span>{t('Full name')}</span>
					<input
						type="text"
						placeholder={'Full name / company name'}
						value={updateData.memberFullName || ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberFullName: value })}
					/>
				</label>
				<label className={'ma-input'}>
					<span>{t('Phone')}</span>
					{/* the phone is changed only with an SMS code to the new number */}
					<div className={'ma-code-row'}>
						<input type="tel" value={formatPhone(user.memberPhone)} readOnly />
						<button type="button" className={'ma-btn ma-btn--outline'} onClick={() => setPhoneEdit(!phoneEdit)}>
							{phoneEdit ? t('Cancel') : t('Change')}
						</button>
					</div>
					<em className={'ma-input__hint'}>{user.memberPhoneVerified ? `✓ ${t('Phone confirmed')}` : t('Phone not confirmed')}</em>
				</label>
				<label className={'ma-input'}>
					<span>{t('Address')}</span>
					<input
						type="text"
						placeholder={'Tashkent, Chilonzor'}
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
							maxLength={12}
							placeholder={t('5-12 characters') as string}
							value={passwords.newPassword}
							onChange={({ target: { value } }) => setPasswords({ ...passwords, newPassword: value })}
						/>
					</label>
					<label className={'ma-input'}>
						<span>{t('Confirm new password')}</span>
						<input
							type="password"
							autoComplete="new-password"
							maxLength={12}
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
			</section>
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
