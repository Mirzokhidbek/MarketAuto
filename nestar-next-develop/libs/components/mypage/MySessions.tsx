import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import { GET_MY_SESSIONS } from '../../../apollo/user/query';
import { LOGOUT_OTHER_SESSIONS, REVOKE_MY_SESSION } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface Session {
	_id: string;
	userAgent: string;
	startedAt: string;
	lastActiveAt: string;
	current: boolean;
}

/** "Chrome · Windows" from a browser identification string */
export const describeDevice = (ua: string): { name: string; mobile: boolean } => {
	const browser = /Edg\//.test(ua)
		? 'Edge'
		: /OPR\/|Opera/.test(ua)
		? 'Opera'
		: /YaBrowser/.test(ua)
		? 'Yandex'
		: /Firefox\//.test(ua)
		? 'Firefox'
		: /Chrome\//.test(ua)
		? 'Chrome'
		: /Safari\//.test(ua)
		? 'Safari'
		: '';
	const os = /Android/.test(ua)
		? 'Android'
		: /iPhone|iPad|iPod/.test(ua)
		? 'iOS'
		: /Windows/.test(ua)
		? 'Windows'
		: /Mac OS X/.test(ua)
		? 'macOS'
		: /Linux/.test(ua)
		? 'Linux'
		: '';
	return { name: [browser, os].filter(Boolean).join(' · '), mobile: /Mobile|Android|iPhone|iPad/.test(ua) };
};

/** Profile → Devices: where the account is logged in, with "log out" per device and for all others */
const MySessions = () => {
	const { t } = useTranslation('common');
	const { data, refetch } = useQuery(GET_MY_SESSIONS, { fetchPolicy: 'network-only' });
	const [revokeMySession] = useMutation(REVOKE_MY_SESSION);
	const [logoutOtherSessions, { loading }] = useMutation(LOGOUT_OTHER_SESSIONS);
	const sessions: Session[] = data?.getMySessions ?? [];
	const others = sessions.filter((session) => !session.current).length;

	const revoke = async (session: Session) => {
		try {
			await revokeMySession({ variables: { sessionId: session._id } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Logged out on that device') as string, 900);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const revokeOthers = async () => {
		if (!(await sweetConfirmAlert(t('Log out on all other devices?') as string))) return;
		try {
			await logoutOtherSessions();
			await refetch();
			await sweetTopSmallSuccessAlert(t('Logged out on other devices') as string, 900);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<section className={'ma-form-section ma-sessions'}>
			<div className={'ma-sessions__head'}>
				<div>
					<h2>{t('Devices')}</h2>
					<p>
						{t('Where your account is logged in. Log out of any device you do not recognise and change your password.')}
					</p>
				</div>
				{others > 0 && (
					<button type="button" className={'ma-btn ma-btn--outline'} disabled={loading} onClick={revokeOthers}>
						{t('Log out on other devices')}
					</button>
				)}
			</div>
			<ul>
				{sessions.map((session) => {
					const device = describeDevice(session.userAgent);
					return (
						<li key={session._id} className={session.current ? 'is-current' : ''}>
							<span className={'ma-sessions__icon'}>
								{device.mobile ? <PhoneIphoneOutlinedIcon /> : <ComputerOutlinedIcon />}
							</span>
							<div className={'ma-sessions__body'}>
								<strong>
									{device.name || t('Unknown browser')}
									{session.current && <em>{t('This device')}</em>}
								</strong>
								<span>
									{t('Logged in')} {moment(session.startedAt).format('DD.MM.YYYY')} · {t('Active')}{' '}
									{moment(session.lastActiveAt).fromNow()}
								</span>
							</div>
							{!session.current && (
								<button type="button" className={'ma-link-btn'} onClick={() => revoke(session)}>
									{t('Log out')}
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</section>
	);
};

export default MySessions;
