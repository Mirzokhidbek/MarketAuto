import React from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useMutation, useReactiveVar } from '@apollo/client/react';
import { REPORT_PROPERTY } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { ReportReason } from '../../enums/property.enum';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { FlagIcon as FlagOutlinedIcon } from '../ui/icons';

/** "Report listing": reason + optional comment, reviewed by admins in Admin > Reports */
const ReportButton = ({ propertyId }: { propertyId: string }) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [reportProperty] = useMutation<any>(REPORT_PROPERTY);

	const reportHandler = async () => {
		if (!user?._id) {
			await router.push('/account/join');
			return;
		}
		const options = Object.fromEntries(Object.values(ReportReason).map((reason) => [reason, t(`report_${reason}`)]));
		const { value } = await Swal.fire({
			title: t('Report listing') as string,
			html: `<textarea id="ma-report-comment" class="swal2-textarea" maxlength="500" placeholder="${t('Comment (optional)')}"></textarea>`,
			input: 'select',
			inputOptions: options,
			inputPlaceholder: t('Choose a reason') as string,
			showCancelButton: true,
			confirmButtonText: t('Send') as string,
			cancelButtonText: t('Cancel') as string,
			confirmButtonColor: '#d93025',
			inputValidator: (reason: string) => (!reason ? (t('Choose a reason') as string) : null),
			preConfirm: (reason: string) => ({
				reason,
				comment: (document.getElementById('ma-report-comment') as HTMLTextAreaElement)?.value?.trim() ?? '',
			}),
		});
		if (!value?.reason) return;
		try {
			await reportProperty({
				variables: { input: { propertyId, reportReason: value.reason, reportComment: value.comment || undefined } },
			});
			await sweetTopSmallSuccessAlert(t('Thank you! Our team will check this listing.') as string, 1800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<button
			type="button"
			className="mt-1 inline-flex cursor-pointer items-center gap-1 self-center border-0 bg-transparent font-sans text-[13px] font-semibold text-muted hover:text-[#d93025] hover:underline"
			onClick={reportHandler}
		>
			<FlagOutlinedIcon className="text-base" /> {t('Report listing')}
		</button>
	);
};

export default ReportButton;
