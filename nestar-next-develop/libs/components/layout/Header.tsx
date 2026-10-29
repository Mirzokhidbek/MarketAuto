import { imageUrl } from '../utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useRouter, withRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { getJwtToken, logOut, updateUserInfo } from '../auth';
import { Stack, Box } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { alpha, styled } from '@mui/material/styles';
import Menu, { MenuProps } from '@mui/material/Menu';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { CaretDown } from 'phosphor-react';
import Link from 'next/link';
import NotificationBell from './common/NotificationBell';
import { CurrencySwitch, MessagesLink, useGlobalSync } from './common/HeaderExtras';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { Logout } from '@mui/icons-material';
import { REACT_APP_API_URL } from '../config';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Top = () => {
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
				<Stack className={'container'}>
					<Box component={'div'} className={'logo-box'}>
						<Link href={'/'}>
							<img src="/img/logo/logoDark.svg" alt="MarketAuto" />
						</Link>
					</Box>
					<button
						className={'ma-burger'}
						aria-label={t('Menu') as string}
						onClick={() => setMenuOpen((prev) => !prev)}
					>
						{menuOpen ? <CloseIcon /> : <MenuIcon />}
					</button>
					<Box
						component={'div'}
						className={`router-box ${menuOpen ? 'is-open' : ''}`}
						onClick={() => setMenuOpen(false)}
					>
						<Link href={'/'}>
							<div>{t('Home')}</div>
						</Link>
						<Link href={'/property'}>
							<div>{t('Cars')}</div>
						</Link>
						<Link href={'/agent'}>
							<div> {t('Sellers')} </div>
						</Link>
						{user?._id && (
							<Link href={'/mypage'}>
								<div> {t('My Page')} </div>
							</Link>
						)}
						{/* buying and selling first; articles are secondary */}
						<Link href={'/community?articleCategory=FREE'}>
							<div> {t('Community')} </div>
						</Link>
						<Link href={'/cs'}>
							<div> {t('CS')} </div>
						</Link>
						{/* phones: actions that do not fit into the header bar */}
						<div className={'ma-burger-extras'} onClick={(e) => e.stopPropagation()}>
							<Link href={user?._id ? '/mypage?category=addProperty' : '/account/join'}>
								<span className={'ma-btn ma-btn--primary ma-btn--block'}>{t('Sell a car')}</span>
							</Link>
							<CurrencySwitch />
						</div>
					</Box>
					<Box component={'div'} className={'user-box'}>
						<Link href={user?._id ? '/mypage?category=addProperty' : '/account/join'}>
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
									<MenuItem onClick={() => logOut()}>
										<Logout fontSize="small" style={{ color: '#0B57D0', marginRight: '10px' }} />
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
								endIcon={<CaretDown size={14} color="#616161" weight="fill" />}
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

export default withRouter(Top);
