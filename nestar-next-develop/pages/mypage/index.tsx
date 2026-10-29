import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { getJwtToken } from '../../libs/auth';
import withLayoutFull from '../../libs/components/layout/LayoutFull';
import MyCars from '../../libs/components/mypage/MyCars';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import AddCarForm from '../../libs/components/mypage/AddCarForm';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import MyPageMenu from '../../libs/components/mypage/MyPageMenu';
import MessagesPanel from '../../libs/components/mypage/MessagesPanel';
import SavedSearches from '../../libs/components/mypage/SavedSearches';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const category: any = router.query?.category ?? 'myProfile';

	/** APOLLO REQUESTS **/
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	/** LIFECYCLES **/
	useEffect(() => {
		// user info is restored from the token by the layout; only redirect when there is no session at all
		if (!getJwtToken()) router.push('/account/join').then();
	}, []);

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
			await sweetTopSmallSuccessAlert('Subscribed!', 800);
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
			await sweetTopSmallSuccessAlert('Unsubscribed!', 800);
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
		<div id="my-page" className={'ma-page ma-account'}>
			<div className={'ma-container ma-account__layout'}>
				<MyPageMenu />
				<section className={'ma-account__content'}>
					{category === 'addProperty' && <AddCarForm />}
					{category === 'myProperties' && <MyCars />}
					{category === 'myFavorites' && <MyFavorites />}
					{category === 'recentlyVisited' && <RecentlyVisited />}
					{category === 'myArticles' && <MyArticles />}
					{category === 'writeArticle' && <WriteArticle />}
					{category === 'myProfile' && <MyProfile />}
					{category === 'messages' && <MessagesPanel />}
					{category === 'savedSearches' && <SavedSearches />}
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
				</section>
			</div>
		</div>
	);
};

export default withLayoutFull(MyPage);
