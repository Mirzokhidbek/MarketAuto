import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { LegalDoc } from '../../legal';
import PageContainer from '../ui/PageContainer';
import { cx } from '../ui/classNames';

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
		<div className="pt-8 pb-12 font-sans">
			<PageContainer className="w-[860px]! pt-2 text-[15px] leading-[1.7] [overflow-wrap:anywhere] text-ink">
				<nav className="mb-5 flex flex-wrap gap-2" aria-label={t('Legal documents') as string}>
					{LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={cx(
								'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold no-underline',
								pathname === link.href
									? 'border-primary bg-[#e6efff] text-primary-dark'
									: 'border-line text-text hover:border-primary hover:text-primary',
							)}
						>
							{t(link.label)}
						</Link>
					))}
				</nav>
				<p className="m-0 mb-2.5 text-[13px] text-muted">{doc.updated}</p>
				<p className="m-0 mb-2.5 text-[17px]">{doc.intro}</p>
				{doc.sections.map((section) => (
					<section key={section.title} className="mt-[26px]">
						<h2 className="m-0 mb-2 text-[19px]">{section.title}</h2>
						{section.text.map((paragraph) => (
							<p key={paragraph} className="m-0 mb-2.5">
								{paragraph}
							</p>
						))}
					</section>
				))}
			</PageContainer>
		</div>
	);
};

export default LegalDocument;
