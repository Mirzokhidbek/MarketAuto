/** numbers the way the site always showed them: 34,500 / 1.5 / 12.34 (Intl instead of a formatting library) */
export const formatNumber = (value: number | undefined | null, { decimals = 0, grouping = true }: { decimals?: number; grouping?: boolean } = {}) =>
	new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, useGrouping: grouping }).format(Number(value ?? 0) || 0);
