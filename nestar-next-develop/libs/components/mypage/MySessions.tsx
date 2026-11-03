import React from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslation } from 'next-i18next/pages';
import { GET_MY_SESSIONS } from '../../../apollo/user/query';
import { LOGOUT_OTHER_SESSIONS, REVOKE_MY_SESSION } from '../../../apollo/user/mutation';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { ComputerIcon as ComputerOutlinedIcon, SmartphoneIcon as PhoneIphoneOutlinedIcon } from '../ui/icons';
import { linkButton } from '../ui/styles';
import { buttonClasses } from '../ui/Button';
import { formatDate, fromNow } from '../../date';

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
	const { data, refetch } = useQuery<any>(GET_MY_SESSIONS, { fetchPolicy: 'network-only' });
	const [revokeMySession] = useMutation<any>(REVOKE_MY_SESSION);
	const [logoutOtherSessions, { loading }] = useMutation<any>(LOGOUT_OTHER_SESSIONS);
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
		<section className="border-t border-line py-[22px] font-sans">
			<div className="mb-2 flex items-start justify-between gap-4 max-sm:flex-col">
				<div>
					<h2 className="m-0 mb-1 text-base font-bold text-ink">{t('Devices')}</h2>
					<p className="m-0 text-[13px] text-muted">
						{t('Where your account is logged in. Log out of any device you do not recognise and change your password.')}
					</p>
				</div>
				{others > 0 && (
					<button type="button" className={buttonClasses({ variant: 'outline', className: 'shrink-0' })} disabled={loading} onClick={revokeOthers}>
						{t('Log out on other devices')}
					</button>
				)}
			</div>
			<ul className="m-0 list-none p-0">
				{sessions.map((session) => {
					const device = describeDevice(session.userAgent);
					return (
						<li key={session._id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
							<span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-surface text-muted">
								{device.mobile ? <PhoneIphoneOutlinedIcon /> : <ComputerOutlinedIcon />}
							</span>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<strong className="flex flex-wrap items-center gap-2 text-sm text-ink">
									{device.name || t('Unknown browser')}
									{session.current && <em className="rounded-full bg-[#e6f4ea] px-2 py-px text-[11px] font-semibold text-[#127a46] not-italic">{t('This device')}</em>}
								</strong>
								<span className="text-xs text-muted">
									{t('Logged in')} {formatDate(session.startedAt, 'DD.MM.YYYY')} · {t('Active')}{' '}
									{fromNow(session.lastActiveAt)}
								</span>
							</div>
							{!session.current && (
								<button type="button" className={linkButton} onClick={() => revoke(session)}>
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
