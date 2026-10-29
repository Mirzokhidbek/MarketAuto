import React from 'react';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { Member } from '../../types/member/member';

/** trust signals for a seller: confirmed phone, checked dealership, time on the site, reply speed */
const SellerTrust = ({ member, compact = false }: { member?: Partial<Member> | null; compact?: boolean }) => {
	const { t } = useTranslation('common');
	if (!member) return null;
	const items: { icon: React.ReactNode; text: string; strong?: boolean }[] = [];
	if (member.memberDealerVerified) items.push({ icon: <StorefrontOutlinedIcon />, text: t('Verified dealer'), strong: true });
	if (member.memberPhoneVerified) items.push({ icon: <VerifiedIcon />, text: t('Phone confirmed'), strong: true });
	if (!compact && member.createdAt)
		items.push({ icon: <EventAvailableOutlinedIcon />, text: `${t('On MarketAuto since')} ${moment(member.createdAt).format('MMMM YYYY')}` });
	if (!compact && member.memberResponseMinutes)
		items.push({
			icon: <ScheduleOutlinedIcon />,
			text: `${t('Usually replies within')} ${moment.duration(Math.max(member.memberResponseMinutes, 5), 'minutes').humanize()}`,
		});
	if (!items.length) return null;
	return (
		<ul className={`ma-trust ${compact ? 'ma-trust--compact' : ''}`}>
			{items.map((item) => (
				<li key={item.text} className={item.strong ? 'is-strong' : ''}>
					{item.icon}
					<span>{item.text}</span>
				</li>
			))}
		</ul>
	);
};

export default SellerTrust;
