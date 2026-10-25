import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'next-i18next';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		border: `1px solid ${theme.palette.divider}`,
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
	}),
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.4rem' }} />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : '#fff',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(180deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const Faq = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [category, setCategory] = useState<string>('property');
	const [expanded, setExpanded] = useState<string | false>('panel1');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/

	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
	};

	const data: any = {
		property: [
			{
				id: 'faq001',
				subject: 'Are the cars listed on MarketAuto reliable?',
				content:
					'Every listing belongs to a registered member with a public profile. Always inspect the car and its documents before paying.',
			},
			{
				id: 'faq002',
				subject: 'What types of cars can I find here?',
				content:
					'New and used sedans, SUVs, hatchbacks, minivans, pickups, coupes, wagons and convertibles from all popular brands.',
			},
			{
				id: 'faq003',
				subject: 'How do I search for a specific car?',
				content:
					'Use the filters on the Cars page: city, body type, brand, fuel, transmission, year, mileage and price.',
			},
			{
				id: 'faq004',
				subject: 'What does "Barter" mean on a listing?',
				content:
					'The seller is open to exchanging the car for another car or property, fully or with an additional payment.',
			},
			{
				id: 'faq005',
				subject: 'Can I rent a car through MarketAuto?',
				content: 'Yes. Listings marked "Rent" are available for rent. Contact the seller for terms and prices.',
			},
			{
				id: 'faq006',
				subject: 'How is the mileage shown?',
				content: 'Mileage is shown in kilometers, exactly as entered by the seller. Verify it during inspection.',
			},
		],
		payment: [
			{
				id: 'faq007',
				subject: 'Is listing a car free?',
				content: 'Yes, creating a listing on MarketAuto is free.',
			},
			{
				id: 'faq008',
				subject: 'How do I pay for a car?',
				content:
					'Payment is agreed directly between the buyer and the seller. We recommend paying only after inspecting the car and signing the documents.',
			},
			{
				id: 'faq009',
				subject: 'Which currency are prices in?',
				content: 'Prices are shown in US dollars. The seller can tell you the price in Uzbek sum if needed.',
			},
			{
				id: 'faq010',
				subject: 'Can I buy a car with a loan?',
				content: 'Many dealers offer loans or installment plans. Ask the dealer about the conditions.',
			},
			{
				id: 'faq011',
				subject: 'Does MarketAuto take a commission?',
				content: 'No. MarketAuto does not take a commission from the deal between buyer and seller.',
			},
		],
		buyers: [
			{
				id: 'faq012',
				subject: 'How do I contact a seller?',
				content: 'Open the car page and use the contact form or call the phone number shown on the seller card.',
			},
			{
				id: 'faq013',
				subject: 'What should I check before buying?',
				content:
					'Check the technical passport, VIN number, service history, body condition and do a test drive. A diagnostic at a service center is recommended.',
			},
			{
				id: 'faq014',
				subject: 'How do I save cars I like?',
				content: 'Click the heart icon on any car. You can find all saved cars in My Page > My Favorites.',
			},
			{
				id: 'faq015',
				subject: 'Can I see cars I viewed before?',
				content: 'Yes, in My Page > Recently Visited.',
			},
			{
				id: 'faq016',
				subject: 'How do I report a suspicious listing?',
				content: 'Write to us through the Support page and include the listing link. Our team will review it.',
			},
		],
		agents: [
			{
				id: 'faq017',
				subject: 'How do I become a dealer?',
				content: 'Sign up and choose the Dealer account type. Dealers can add and manage car listings.',
			},
			{
				id: 'faq018',
				subject: 'How many cars can a dealer list?',
				content: 'There is no fixed limit. Keep your listings accurate and up to date.',
			},
			{
				id: 'faq019',
				subject: 'How do I mark a car as sold?',
				content: 'Go to My Page > My Cars and change the status of the car to Sold.',
			},
			{
				id: 'faq020',
				subject: 'How is the dealer ranking calculated?',
				content: 'Rankings are updated daily based on the number of listings, articles, likes and views.',
			},
			{
				id: 'faq021',
				subject: 'Can I edit a listing after publishing?',
				content: 'Yes. Open My Page > My Cars and click edit on the listing.',
			},
		],
		membership: [
			{
				id: 'faq022',
				subject: 'How do I create an account?',
				content: 'Click Login / Register at the top of the page and fill in your nickname, password and phone number.',
			},
			{
				id: 'faq023',
				subject: 'I forgot my password. What should I do?',
				content: 'Contact our support team through the Support page and we will help you restore access.',
			},
			{
				id: 'faq024',
				subject: 'How do I change my profile information?',
				content: 'Go to My Page > My Profile to update your photo, phone, address and description.',
			},
			{
				id: 'faq025',
				subject: 'Can I delete my account?',
				content: 'Yes. Send a request through the Support page and we will delete your account.',
			},
		],
		community: [
			{
				id: 'faq026',
				subject: 'What is the Community section?',
				content: 'A place to share car news, reviews, tips and stories with other car owners.',
			},
			{
				id: 'faq027',
				subject: 'Who can write articles?',
				content: 'Any registered member can write articles and comments.',
			},
			{
				id: 'faq028',
				subject: 'What content is not allowed?',
				content: 'Spam, advertising outside listings, offensive language and false information are not allowed.',
			},
			{
				id: 'faq029',
				subject: 'How do I follow other members?',
				content: 'Open a member or dealer page and click Follow to see their new cars and articles.',
			},
		],
		other: [
			{
				id: 'faq030',
				subject: 'Which cities does MarketAuto cover?',
				content:
					'All regions of Uzbekistan: Tashkent, Samarkand, Bukhara, Andijan, Namangan, Fergana, Navoi, Karshi, Termez, Jizzakh, Gulistan, Urgench, Nukus and Tashkent region.',
			},
			{
				id: 'faq031',
				subject: 'Which languages does the site support?',
				content: 'Uzbek, Russian and English. Use the flag menu at the top right to switch.',
			},
			{
				id: 'faq032',
				subject: 'How can I contact support?',
				content: 'Write to us by email or call our call center from the Support page.',
			},
		],
	};

	const categories = [
		{ key: 'property', label: 'Cars' },
		{ key: 'payment', label: 'Payment' },
		{ key: 'buyers', label: 'For Buyers' },
		{ key: 'agents', label: 'For Dealers' },
		{ key: 'membership', label: 'Membership' },
		{ key: 'community', label: 'Community' },
		{ key: 'other', label: 'Other' },
	];

	return (
		<div className={'ma-faq-block'}>
			<div className={'ma-tabs'}>
				{categories.map((item) => (
					<button
						key={item.key}
						className={`ma-tab ${category === item.key ? 'is-active' : ''}`}
						onClick={() => changeCategoryHandler(item.key)}
					>
						{t(item.label)}
					</button>
				))}
			</div>
			<div className={'ma-faq-list'}>
				{data[category]?.map((item: any) => (
					<details className={'ma-faq'} key={item.id}>
						<summary>
							{t(item.subject)}
							<ExpandMoreRoundedIcon />
						</summary>
						<p>{t(item.content)}</p>
					</details>
				))}
			</div>
		</div>
	);
};

export default Faq;
