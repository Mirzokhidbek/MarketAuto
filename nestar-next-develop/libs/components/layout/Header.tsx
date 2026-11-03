import { imageUrl, joinHref } from '../../utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { getJwtToken, logOut, updateUserInfo } from '../../auth/index';
import { Stack, Box } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import Menu, { MenuProps } from '@mui/material/Menu';
import Link from 'next/link';
import NotificationBell from '../common/NotificationBell';
import { CurrencySwitch, MessagesLink, useGlobalSync } from '../common/HeaderExtras';
import { useReactiveVar } from '@apollo/client/react';
import { userVar } from '../../../apollo/store';
import { REACT_APP_API_URL } from '../../config';
import { appBarVar, defaultPageTitle } from '../../hooks/useAppBar';
import { goBack, isRootPage } from '../../hooks/useBack';
import { AccountCircleIcon as AccountCircleOutlinedIcon, MenuIcon, CloseIcon, ArrowBackIcon, LogoutIcon as Logout, ChevronDownIcon as CaretDown } from '../ui/icons';

const Header = () => {
	const user = useReactiveVar(userVar);
	const { t, i18n } = useTranslation('common');
	const router = useRouter();
	const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
	// the flag always matches the language of the page being shown
	const lang = router.locale ?? 'en';
	const drop = Boolean(anchorEl2);
	const [colorChange, setColorChange] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [anchorEl, setAnchorEl] = React.useState<any | HTMLElement>(null);
	let open = Boolean(anchorEl);
	const [bgColor, setBgColor] = useState<boolean>(false);
	const [logoutAnchor, setLogoutAnchor] = React.useState<null | HTMLElement>(null);
	const logoutOpen = Boolean(logoutAnchor);
	const appBar = useReactiveVar(appBarVar);
	const category = typeof router.query.category === 'string' ? router.query.category : undefined;
	const appBarTitle = appBar.title ?? t(defaultPageTitle(router.pathname, category));
	useGlobalSync();

	/** LIFECYCLES **/
	// reopen the site in the language the visitor chose last time
	useEffect(() => {
		const saved = localStorage.getItem('locale');
		if (saved && saved !== router.locale && router.locale === router.defaultLocale && router.locales?.includes(saved)) {
			router.replace(router.asPath, router.asPath, { locale: saved }).then();
		}
	}, []);

	useEffect(() => {
		switch (router.pathname) {
			case '/property/detail':
				setBgColor(true);
				break;
			default:
				break;
		}
	}, [router]);

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	/** HANDLERS **/
	const langClick = (e: any) => {
		setAnchorEl2(e.currentTarget);
	};

	const langClose = () => {
		setAnchorEl2(null);
	};

	const langChoice = useCallback(
		async (locale: string) => {
			localStorage.setItem('locale', locale);
			setAnchorEl2(null);
			await router.push(router.asPath, router.asPath, { locale });
		},
		[router],
	);

	const changeNavbarColor = () => {
		if (window.scrollY >= 50) {
			setColorChange(true);
		} else {
			setColorChange(false);
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	// the section the visitor is in is highlighted in the menu
	const navClass = (path: string) =>
		(path === '/' ? router.pathname === '/' : router.pathname.startsWith(path)) ? 'is-active' : undefined;

	const handleHover = (event: any) => {
		if (anchorEl !== event.currentTarget) {
			setAnchorEl(event.currentTarget);
		} else {
			setAnchorEl(null);
		}
	};

	const StyledMenu = styled((props: MenuProps) => (
		<Menu
			elevation={0}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			{...props}
		/>
	))(({ theme }) => ({
		'& .MuiPaper-root': {
			top: '109px',
			borderRadius: 6,
			marginTop: theme.spacing(1),
			minWidth: 160,
			color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
			boxShadow:
				'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
			'& .MuiMenu-list': {
				padding: '4px 0',
			},
			'& .MuiMenuItem-root': {
				'& .MuiSvgIcon-root': {
					fontSize: 18,
					color: theme.palette.text.secondary,
					marginRight: theme.spacing(1.5),
				},
				'&:active': {
					backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
				},
			},
		},
	}));

	if (typeof window !== 'undefined') {
		window.addEventListener('scroll', changeNavbarColor);
	}

	return (
		<Stack className={'navbar'}>
			<Stack className={`navbar-main ${colorChange ? 'transparent' : ''} ${bgColor ? 'transparent' : ''}`}>
				{/* phones, inner pages: an app bar "← Title  actions" instead of the logo bar */}
				{!isRootPage(router.pathname) && (
					<div className={'ma-appbar'}>
						<button type="button" className={'ma-appbar__back'} aria-label={t('Back') as string} onClick={goBack}>
							<ArrowBackIcon />
						</button>
						<h1 className={'ma-appbar__title'}>{appBarTitle}</h1>
						{appBar.actions && <div className={'ma-appbar__actions'}>{appBar.actions}</div>}
					</div>
				)}
				<Stack className={'container'}>
					<Box component={'div'} className={'logo-box'}>
						<Link href={'/'}>
							<img src="/img/logo/logo.png" alt="CarPort" />
						</Link>
					</Box>
					<button
						className={'ma-burger'}
						aria-label={t('Menu') as string}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((prev) => !prev)}
					>
						{menuOpen ? <CloseIcon /> : <MenuIcon />}
					</button>
					{/* phones: dims the page under the open menu; a tap outside closes it */}
					{menuOpen && <div className={'ma-menu-backdrop'} onClick={() => setMenuOpen(false)} />}
					<Box
						component={'div'}
						className={`router-box ${menuOpen ? 'is-open' : ''}`}
						onClick={() => setMenuOpen(false)}
					>
						<Link href={'/'} className={navClass('/')}>
							<div>{t('Home')}</div>
						</Link>
						<Link href={'/property'} className={navClass('/property')}>
							<div>{t('Cars')}</div>
						</Link>
						<Link href={'/agent'} className={navClass('/agent')}>
							<div> {t('Sellers')} </div>
						</Link>
						{/* buying and selling first; articles are secondary */}
						<Link href={'/community?articleCategory=FREE'} className={navClass('/community')}>
							<div> {t('Community')} </div>
						</Link>
						<Link href={'/cs'} className={navClass('/cs')}>
							<div> {t('CS')} </div>
						</Link>
						{/* phones: actions that do not fit into the header bar */}
						<div className={'ma-burger-extras'} onClick={(e) => e.stopPropagation()}>
							<Link href={user?._id ? '/mypage?category=addProperty' : joinHref('/mypage?category=addProperty')}>
								<span className={'ma-btn ma-btn--primary ma-btn--block'}>{t('Sell a car')}</span>
							</Link>
							<CurrencySwitch />
						</div>
					</Box>
					<Box component={'div'} className={'user-box'}>
						<Link href={user?._id ? '/mypage?category=addProperty' : joinHref('/mypage?category=addProperty')}>
							<span className={'ma-btn ma-btn--primary ma-nav-sell'}>{t('Sell a car')}</span>
						</Link>
						{user?._id ? (
							<>
								<div className={'login-user'} onClick={(event: any) => setLogoutAnchor(event.currentTarget)}>
									<img
										src={
											user?.memberImage ? imageUrl(user?.memberImage) : '/img/profile/defaultUser.svg'
										}
										alt=""
									/>
								</div>

								<Menu
									id="basic-menu"
									anchorEl={logoutAnchor}
									open={logoutOpen}
									onClose={() => {
										setLogoutAnchor(null);
									}}
									sx={{ mt: '5px' }}
								>
									<MenuItem
										onClick={() => {
											setLogoutAnchor(null);
											router.push(`/member?memberId=${user._id}`);
										}}
									>
										{t('My public profile')}
									</MenuItem>
									<MenuItem
										onClick={() => {
											setLogoutAnchor(null);
											router.push('/mypage');
										}}
									>
										{t('My Page')}
									</MenuItem>
									{user.memberType === 'ADMIN' && (
										<MenuItem
											onClick={() => {
												setLogoutAnchor(null);
												router.push('/_admin');
											}}
										>
											{t('Admin panel')}
										</MenuItem>
									)}
									<MenuItem onClick={() => logOut()}>
										<Logout fontSize="small" style={{ color: '#015DEA', marginRight: '10px' }} />
										{t('Logout')}
									</MenuItem>
								</Menu>
							</>
						) : (
							<Link href={'/account/join'}>
								<div className={'join-box'}>
									<AccountCircleOutlinedIcon />
									<span>
										{t('Login')} / {t('Register')}
									</span>
								</div>
							</Link>
						)}

						<div className={'lan-box'}>
							<CurrencySwitch />
							{user?._id && <MessagesLink />}
							{user?._id && <NotificationBell />}
							<Button
								disableRipple
								className="btn-lang"
								onClick={langClick}
								endIcon={<CaretDown size={14} color="#616161" />}
							>
								<Box component={'div'} className={'flag'}>
									<img src={`/img/flag/lang${lang}.png`} alt={lang} />
								</Box>
							</Button>

							<StyledMenu anchorEl={anchorEl2} open={drop} onClose={langClose} sx={{ position: 'absolute' }}>
								<MenuItem disableRipple onClick={() => langChoice('en')}>
									<img className="img-flag" src={'/img/flag/langen.png'} alt={''} />
									{t('English')}
								</MenuItem>
								<MenuItem disableRipple onClick={() => langChoice('uz')}>
									<img className="img-flag" src={'/img/flag/languz.png'} alt={''} />
									{t('Uzbek')}
								</MenuItem>
								<MenuItem disableRipple onClick={() => langChoice('ru')}>
									<img className="img-flag" src={'/img/flag/langru.png'} alt={''} />
									{t('Russian')}
								</MenuItem>
							</StyledMenu>
						</div>
					</Box>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default withRouter(Header);
