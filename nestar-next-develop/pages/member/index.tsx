import React, { useEffect } from 'react';
import { NextPage } from 'next';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import { Stack } from '@mui/material';
import MemberMenu from '../../libs/components/member/MemberMenu';
import MemberCars from '../../libs/components/member/MemberCars';
import { useRouter } from 'next/router';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import MemberArticles from '../../libs/components/member/MemberArticles';
import MemberReviews from '../../libs/components/member/MemberReviews';
import { useMutation, useReactiveVar } from '@apollo/client';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { userVar } from '../../apollo/store';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MemberPage: NextPage = () => {
	const router = useRouter();
	const category: any = router.query?.category;
	const user = useReactiveVar(userVar);

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		if (!category) {
			router.replace(
				{
					pathname: router.pathname,
					query: { ...router.query, category: 'properties' },
				},
				undefined,
				{ shallow: true },
			);
		}
	}, [category, router]);

	/** HANDLERS **/
	const subscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await subscribe({
				variables: {
					input: id,
				},
			});
			await sweetTopSmallSuccessAlert('Followed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const unsubscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user._id) throw new Error(Messages.error2);

			await unsubscribe({
				variables: {
					input: id,
				},
			});

			await sweetTopSmallSuccessAlert('Unfollowed!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const likeMemberHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);

			await likeTargetMember({
				variables: {
					input: id,
				},
			});
			await sweetTopSmallSuccessAlert('Success!', 800);
			await refetch({ input: query });
		} catch (err: any) {
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	return (
		<div id="member-page" className={'ma-page ma-account'}>
			<div className={'ma-container ma-account__layout'}>
				<MemberMenu subscribeHandler={subscribeHandler} unsubscribeHandler={unsubscribeHandler} />
				<section className={'ma-account__content'}>
					{category === 'properties' && <MemberCars />}
					{category === 'followers' && (
						<MemberFollowers
							subscribeHandler={subscribeHandler}
							unsubscribeHandler={unsubscribeHandler}
							likeMemberHandler={likeMemberHandler}
							redirectToMemberPageHandler={redirectToMemberPageHandler}
						/>
					)}
					{category === 'followings' && (
						<MemberFollowings
							subscribeHandler={subscribeHandler}
							unsubscribeHandler={unsubscribeHandler}
							likeMemberHandler={likeMemberHandler}
							redirectToMemberPageHandler={redirectToMemberPageHandler}
						/>
					)}
					{category === 'articles' && <MemberArticles />}
					{category === 'reviews' && <MemberReviews />}
				</section>
			</div>
		</div>
	);
};

export default withLayoutFull(MemberPage);
