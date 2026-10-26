import { compareVar } from '../apollo/store';

export const MAX_COMPARE = 3;

/** adds/removes a car in the comparison list; returns false when the list is already full */
export const toggleCompare = (id: string): boolean => {
	const list = compareVar();
	let next: string[];
	if (list.includes(id)) next = list.filter((item) => item !== id);
	else if (list.length >= MAX_COMPARE) return false;
	else next = [...list, id];
	compareVar(next);
	localStorage.setItem('compare', JSON.stringify(next));
	return true;
};

export const clearCompare = () => {
	compareVar([]);
	localStorage.setItem('compare', '[]');
};
