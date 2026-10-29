/** joins Tailwind class lists, skipping empty / false parts: cx('a', isOn && 'b') */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
