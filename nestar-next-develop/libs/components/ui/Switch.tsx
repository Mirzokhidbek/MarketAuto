import React from 'react';
import { cx } from './classNames';

/** the toggle itself, for a checkbox inside your own <label> */
export const switchInput =
	"relative m-0 h-[22px] w-10 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-[#cbd5e1] transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] checked:bg-primary checked:after:translate-x-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	children?: React.ReactNode;
	className?: string;
}

/** on / off toggle with its label */
const Switch = ({ checked, onChange, children, className }: SwitchProps) => (
	<label className={cx('inline-flex cursor-pointer items-center gap-2.5 font-sans text-sm text-text', className)}>
		<input type="checkbox" role="switch" className={switchInput} checked={checked} onChange={(e) => onChange(e.target.checked)} />
		{children}
	</label>
);

export default Switch;
