import React, { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { userVar } from '../../../apollo/store';
import { CREATE_INQUIRY } from '../../../apollo/user/mutation';
import { GET_MY_INQUIRIES } from '../../../apollo/user/query';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { T } from '../../types/common';
import { ChevronDownIcon as ExpandMoreRoundedIcon } from '../ui/icons';
import { emptyBox, faqBody, faqItem, faqSummary, field, statusPill, statusTone } from '../ui/styles';
import { buttonClasses } from '../ui/Button';
import { formatDate } from '../../date';

/** 1:1 inquiry to the support team; admins answer in Admin > CS > Inquiry */
const InquiryForm = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState({ noticeTitle: '', noticeContent: '' });
	const [createInquiry, { loading: sending }] = useMutation<any>(CREATE_INQUIRY);
	const { data, refetch } = useQuery<any>(GET_MY_INQUIRIES, {
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
			<div className={`${emptyBox} flex flex-col items-center gap-3.5`}>
				<p className="m-0">{t('Log in to send a question to our support team.')}</p>
				<Link href={'/account/join'} className={buttonClasses()}>
					{t('Login')}
				</Link>
			</div>
		);

	return (
		<div className="flex flex-col gap-4 font-sans">
			<div className="flex flex-col gap-3.5 rounded-[10px] border border-line bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] [&_textarea]:min-h-[140px]">
				<label className={field}>
					<span>{t('Subject')}</span>
					<input
						type="text"
						maxLength={150}
						placeholder={t('e.g. I cannot upload photos') as string}
						value={form.noticeTitle}
						onChange={({ target: { value } }) => setForm({ ...form, noticeTitle: value })}
					/>
				</label>
				<label className={field}>
					<span>{t('Your question')}</span>
					<textarea
						maxLength={3000}
						placeholder={t('Describe the problem in detail (at least 10 characters)') as string}
						value={form.noticeContent}
						onChange={({ target: { value } }) => setForm({ ...form, noticeContent: value })}
					/>
				</label>
				<button className={buttonClasses({ className: 'self-start' })} disabled={!canSend || sending} onClick={submitHandler}>
					{t('Send question')}
				</button>
			</div>

			<h3 className="m-0 mt-3 text-lg text-ink">{t('My questions')}</h3>
			{inquiries.length ? (
				<div className="flex flex-col">
					{inquiries.map((item) => (
						<details className={faqItem} key={item._id}>
							<summary className={faqSummary}>
								<span className={`${statusPill} ${item.noticeStatus === 'ACTIVE' ? statusTone.ACTIVE : statusTone.SOLD}`}>
									{item.noticeStatus === 'ACTIVE' ? t('Answered') : t('Waiting')}
								</span>
								<strong className="flex-1 font-medium">{item.noticeTitle}</strong>
								<span className="text-[13px] text-muted">{formatDate(item.createdAt, 'DD.MM.YYYY')}</span>
								<ExpandMoreRoundedIcon />
							</summary>
							<p className={faqBody}>{item.noticeContent}</p>
							{item.noticeAnswer && (
								<div className="mb-[18px] rounded-[10px] bg-[#eff6ff] px-4 py-3.5">
									<strong className="mb-1 block text-[13px] text-primary">{t('Support answer')}</strong>
									<p className="m-0 text-[15px] leading-[1.65] whitespace-pre-line text-ink">{item.noticeAnswer}</p>
								</div>
							)}
						</details>
					))}
				</div>
			) : (
				<div className={emptyBox}>{t('You have not asked any questions yet.')}</div>
			)}
		</div>
	);
};

export default InquiryForm;
