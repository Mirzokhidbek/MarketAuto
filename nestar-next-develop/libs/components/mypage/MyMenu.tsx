import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HistoryIcon from '@mui/icons-material/History';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { logOut } from '../../auth';
import { sweetConfirmAlert } from '../../sweetAlert';
import { formatPhone } from '../../utils';

const MyMenu = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const category: string = (router.query?.category as string) ?? 'myProfile';
	const isSeller = user?.memberType !== 'ADMIN';

	const groups = [
		{
			title: 'Listings',
			items: [
				...(isSeller
					? [
							{ key: 'addProperty', label: 'Add Car', icon: <AddCircleOutlineIcon /> },
							{ key: 'myProperties', label: 'My Cars', icon: <DirectionsCarOutlinedIcon /> },
					  ]
					: []),
				{ key: 'myFavorites', label: 'My Favorites', icon: <FavoriteBorderIcon /> },
				{ key: 'recentlyVisited', label: 'Recently Visited', icon: <HistoryIcon /> },
			],
		},
		{
			title: 'Community',
			items: [
				{ key: 'myArticles', label: 'My Articles', icon: <ArticleOutlinedIcon /> },
				{ key: 'writeArticle', label: 'Write Article', icon: <EditNoteOutlinedIcon /> },
			],
		},
		{
			title: 'Account',
			items: [
				{ key: 'myProfile', label: 'My Profile', icon: <PersonOutlineIcon /> },
				{ key: 'followers', label: 'Followers', icon: <GroupOutlinedIcon /> },
				{ key: 'followings', label: 'Followings', icon: <PersonAddAltOutlinedIcon /> },
			],
		},
	];

	const logoutHandler = async () => {
		try {
			if (await sweetConfirmAlert(t('Do you want to logout?') as string)) logOut();
		} catch (err: any) {
			console.log('ERROR, logoutHandler:', err.message);
		}
	};

	return (
		<aside className={'ma-side-menu'}>
			<div className={'ma-side-menu__user'}>
				<img
					src={user?.memberImage ? `${REACT_APP_API_URL}/${user?.memberImage}` : '/img/profile/defaultUser.svg'}
					alt={user?.memberNick}
				/>
				<div>
					<strong>{user?.memberFullName || user?.memberNick}</strong>
					<span>{formatPhone(user?.memberPhone)}</span>
					<em className={'ma-badge ma-badge--primary'}>
						{t(user?.memberType === 'AGENT' ? 'Dealer' : user?.memberType === 'ADMIN' ? 'Admin' : 'Private seller')}
					</em>
				</div>
			</div>

			{groups.map((group) => (
				<nav className={'ma-side-menu__group'} key={group.title}>
					<span className={'ma-side-menu__title'}>{t(group.title)}</span>
					{group.items.map((item) => (
						<Link href={{ pathname: '/mypage', query: { category: item.key } }} scroll={false} key={item.key}>
							<span className={`ma-side-menu__item ${category === item.key ? 'is-active' : ''}`}>
								{item.icon}
								{t(item.label)}
							</span>
						</Link>
					))}
				</nav>
			))}

			<button className={'ma-side-menu__item ma-side-menu__logout'} onClick={logoutHandler}>
				<LogoutIcon />
				{t('Logout')}
			</button>
		</aside>
	);
};

export default MyMenu;
