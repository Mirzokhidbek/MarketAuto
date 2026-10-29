import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { userVar } from '../../../apollo/store';
import { CREATE_INQUIRY } from '../../../apollo/user/mutation';
import { GET_MY_INQUIRIES } from '../../../apollo/user/query';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { T } from '../../types/common';

/** 1:1 inquiry to the support team; admins answer in Admin > CS > Inquiry */
const Inquiry = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState({ noticeTitle: '', noticeContent: '' });
	const [createInquiry, { loading: sending }] = useMutation(CREATE_INQUIRY);
	const { data, refetch } = useQuery(GET_MY_INQUIRIES, {
		fetchPolicy: 'network-only',
		skip: !user?._id,
		variables: { input: { page: 1, limit: 20, search: {} } },
	});
	const inquiries: T[] = data?.getMyInquiries?.list ?? [];

	const canSend = form.noticeTitle.trim().length >= 3 && form.noticeContent.trim().length >= 10;

	const submitHandler = async () => {
		try {
			await createInquiry({
				variables: { input: { noticeTitle: form.noticeTitle.trim(), noticeContent: form.noticeContent.trim() } },
			});
			setForm({ noticeTitle: '', noticeContent: '' });
			await refetch();
			await sweetMixinSuccessAlert(t('Your question has been sent. We will answer soon.') as string);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	if (!user?._id)
		return (
			<div className={'ma-empty ma-empty--cta'}>
				<p>{t('Log in to send a question to our support team.')}</p>
				<Link href={'/account/join'}>
					<span className={'ma-btn ma-btn--primary'}>{t('Login')}</span>
				</Link>
			</div>
		);

	return (
		<div className={'ma-inquiry'}>
			<div className={'ma-panel ma-inquiry__form'}>
				<label className={'ma-input'}>
					<span>{t('Subject')}</span>
					<input
						type="text"
						maxLength={150}
						placeholder={t('e.g. I cannot upload photos') as string}
						value={form.noticeTitle}
						onChange={({ target: { value } }) => setForm({ ...form, noticeTitle: value })}
					/>
				</label>
				<label className={'ma-input'}>
					<span>{t('Your question')}</span>
					<textarea
						maxLength={3000}
						placeholder={t('Describe the problem in detail (at least 10 characters)') as string}
						value={form.noticeContent}
						onChange={({ target: { value } }) => setForm({ ...form, noticeContent: value })}
					/>
				</label>
				<button className={'ma-btn ma-btn--primary'} disabled={!canSend || sending} onClick={submitHandler}>
					{t('Send question')}
				</button>
			</div>

			<h3 className={'ma-inquiry__title'}>{t('My questions')}</h3>
			{inquiries.length ? (
				<div className={'ma-notice-list'}>
					{inquiries.map((item) => (
						<details className={'ma-faq ma-notice-item'} key={item._id}>
							<summary>
								<span className={`ma-status ma-status--${item.noticeStatus === 'ACTIVE' ? 'active' : 'sold'}`}>
									{item.noticeStatus === 'ACTIVE' ? t('Answered') : t('Waiting')}
								</span>
								<strong>{item.noticeTitle}</strong>
								<span className={'ma-notice__date'}>{moment(item.createdAt).format('DD.MM.YYYY')}</span>
								<ExpandMoreRoundedIcon />
							</summary>
							<p>{item.noticeContent}</p>
							{item.noticeAnswer && (
								<div className={'ma-inquiry__answer'}>
									<strong>{t('Support answer')}</strong>
									<p>{item.noticeAnswer}</p>
								</div>
							)}
						</details>
					))}
				</div>
			) : (
				<div className={'ma-empty'}>{t('You have not asked any questions yet.')}</div>
			)}
		</div>
	);
};

export default Inquiry;
