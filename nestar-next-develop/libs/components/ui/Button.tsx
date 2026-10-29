import React from 'react';
import Link, { LinkProps } from 'next/link';
import { cx } from './classNames';

type ButtonVariant = 'primary' | 'outline' | 'dark';
type ButtonSize = 'md' | 'sm';

const base =
	'inline-flex items-center justify-center gap-2 rounded-sm border px-[18px] font-sans text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors [&_svg]:text-[19px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
	primary: 'border-transparent bg-primary text-white hover:bg-primary-dark',
	dark: 'border-transparent bg-ink text-white hover:bg-text',
	outline: 'border-line-strong bg-white text-text hover:border-ink',
};

const sizes: Record<ButtonSize, string> = {
	md: 'h-11',
	sm: 'h-[38px]',
};

interface ButtonStyleProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	block?: boolean;
	className?: string;
}

export const buttonClasses = ({ variant = 'primary', size = 'md', block, className }: ButtonStyleProps = {}) =>
	cx(base, variants[variant], sizes[size], block && 'w-full', className);

type ButtonProps = ButtonStyleProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

/** the one button of the site: primary for the main action, outline for the rest */
export const Button = ({ variant, size, block, className, type = 'button', ...rest }: ButtonProps) => (
	<button type={type} className={buttonClasses({ variant, size, block, className })} {...rest} />
);

type ButtonLinkProps = ButtonStyleProps & LinkProps & { children: React.ReactNode };

/** a link that looks like a Button (navigation, not an action) */
export const ButtonLink = ({ variant, size, block, className, children, ...linkProps }: ButtonLinkProps) => (
	<Link {...linkProps} className={buttonClasses({ variant, size, block, className })}>
		{children}
	</Link>
);
