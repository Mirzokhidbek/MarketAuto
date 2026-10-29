import { DocumentNode, useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { LIKE_TARGET_BOARD_ARTICLE, LIKE_TARGET_MEMBER } from '../../apollo/user/mutation';
import { Messages } from '../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../sweetAlert';

/**
 * like / unlike toggle: asks a guest to log in, runs the mutation, then lets the list refresh itself.
 * returns a handler that takes the id of the liked item
 */
const useLikeToggle = (mutation: DocumentNode, afterLike: () => unknown) => {
	const user = useReactiveVar(userVar);
	const [like] = useMutation(mutation);

	return async (id: string) => {
		try {
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);
			await like({ variables: { input: id } });
			await afterLike();
			await sweetTopSmallSuccessAlert('success', 800);
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};
};

export const useLikeArticle = (afterLike: () => unknown) => useLikeToggle(LIKE_TARGET_BOARD_ARTICLE, afterLike);

export const useLikeMember = (afterLike: () => unknown) => useLikeToggle(LIKE_TARGET_MEMBER, afterLike);
