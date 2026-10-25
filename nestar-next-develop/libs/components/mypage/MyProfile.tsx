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
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const { t } = useTranslation('common');
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);

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
			console.log('+image:', image);

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
			console.log('+responseImage: ', responseImage);
			updateData.memberImage = responseImage;
			setUpdateData({ ...updateData });

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
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

	const doDisabledCheck = () => {
		if (!updateData.memberNick || !updateData.memberPhone) {
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
						updateData?.memberImage ? `${REACT_APP_API_URL}/${updateData?.memberImage}` : '/img/profile/defaultUser.svg'
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
					<input
						type="tel"
						placeholder={'998901234567'}
						value={updateData.memberPhone ?? ''}
						onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
					/>
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
