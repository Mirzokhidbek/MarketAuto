import React from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { REMOVE_COMMENT_BY_ADMIN } from '../../../apollo/admin/mutation';
import { MemberType } from '../../enums/member.enum';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

interface AdminRemoveCommentProps {
	commentId: string;
	/** reload the list after the comment is gone */
	onRemoved: () => unknown;
}

/** "Remove" link shown to admins and moderators under any comment or review; the author's own Delete stays as it is */
const AdminRemoveComment = ({ commentId, onRemoved }: AdminRemoveCommentProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [removeComment, { loading }] = useMutation(REMOVE_COMMENT_BY_ADMIN);
	if (user?.memberType !== MemberType.ADMIN) return null;

	const removeHandler = async () => {
		try {
			if (!(await sweetConfirmAlert(t('Remove this comment? The action is written to the action log.') as string))) return;
			await removeComment({ variables: { input: commentId } });
			await onRemoved();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<button className={'ma-link-btn ma-link-btn--danger'} disabled={loading} onClick={removeHandler}>
			{t('Remove (admin)')}
		</button>
	);
};

export default AdminRemoveComment;
