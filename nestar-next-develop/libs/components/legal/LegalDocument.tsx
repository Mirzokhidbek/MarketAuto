import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { LegalDoc } from '../../legal';

const LINKS = [
	{ href: '/terms', label: 'Terms of Use' },
	{ href: '/offer', label: 'Public Offer' },
	{ href: '/privacy', label: 'Privacy Policy' },
];

/** Terms of Use, Public Offer and Privacy Policy: the same layout, with links between the three */
const LegalDocument = ({ docs }: { docs: Record<string, LegalDoc> }) => {
	const { locale, pathname } = useRouter();
	const { t } = useTranslation('common');
	const doc = docs[locale ?? 'uz'] ?? docs.uz;
	return (
		<div className={'ma-page'}>
			<div className={'ma-container ma-container--narrow ma-legal'}>
				<nav className={'ma-legal__nav'} aria-label={t('Legal documents') as string}>
					{LINKS.map((link) => (
						<Link key={link.href} href={link.href} className={pathname === link.href ? 'is-active' : ''}>
							{t(link.label)}
						</Link>
					))}
				</nav>
				<p className={'ma-legal__updated'}>{doc.updated}</p>
				<p className={'ma-legal__intro'}>{doc.intro}</p>
				{doc.sections.map((section) => (
					<section key={section.title}>
						<h2>{section.title}</h2>
						{section.text.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</section>
				))}
			</div>
		</div>
	);
};

export default LegalDocument;
