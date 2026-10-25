import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}
const eventsData: EventData[] = [
	{
		eventTitle: 'Tashkent Motor Show',
		city: 'Tashkent',
		description: 'The biggest car exhibition in Uzbekistan: new models, test drives and special dealer offers!',
		imageSrc: '/img/events/INCHEON.webp',
	},
	{
		eventTitle: 'Electric Car Expo',
		city: 'Tashkent',
		description: 'Discover the latest electric cars from BYD, Chery and more, and learn about charging in Uzbekistan!',
		imageSrc: '/img/events/SEOUL.webp',
	},
	{
		eventTitle: 'Silk Road Classic Car Rally',
		city: 'Samarkand',
		description: 'Classic and retro cars drive the historic Silk Road route. Do not miss this unique rally!',
		imageSrc: '/img/events/DAEGU.webp',
	},
	{
		eventTitle: 'Weekend Car Market',
		city: 'Bukhara',
		description: 'Meet private sellers and dealers in person, compare cars and find the best deal of the season!',
		imageSrc: '/img/events/BUSAN.webp',
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack
				className="event-card"
				style={{
					backgroundImage: `url(${event?.imageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<Box component={'div'} className={'info'}>
					<strong>{event?.city}</strong>
					<span>{event?.eventTitle}</span>
				</Box>
				<Box component={'div'} className={'more'}>
					<span>{event?.description}</span>
				</Box>
			</Stack>
		);
	}
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack className={'events'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span className={'white'}>Events</span>
							<p className={'white'}>Events waiting your attention!</p>
						</Box>
					</Stack>
					<Stack className={'card-wrapper'}>
						{eventsData.map((event: EventData) => {
							return <EventCard event={event} key={event?.eventTitle} />;
						})}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Events;
