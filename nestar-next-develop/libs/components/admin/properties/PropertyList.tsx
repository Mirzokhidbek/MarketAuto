import { useTranslation } from 'next-i18next/pages';
import React from 'react';
import Link from 'next/link';
import { Property } from '../../../types/property/property';
import { PropertyStatus } from '../../../enums/property.enum';
import { formatCarPlace, formatEnumLabel, formatterStr, imageUrl } from '../../../utils';
import { DeleteIcon } from '../../ui/icons';
import { cx } from '../../ui/classNames';
import {
	adminButton,
	adminTable,
	caption,
	checkbox,
	NoRows,
	pillTones,
	PillTone,
	TableScroll,
	td,
	tdActions,
	tdCheck,
	tdTitle,
	th,
	thumb,
	tr,
} from '../ui';
import { formatDate } from '../../../date';

interface PropertyPanelListType {
	properties: Property[];
	loading?: boolean;
	selected: string[];
	onSelect: (ids: string[]) => void;
	/** member card in the admin panel (SUPER) or the public profile */
	sellerHref: (memberId: string) => string;
	changeStatusHandler: (property: Property, status: PropertyStatus) => void;
	removePropertyHandler: (id: string) => void;
}

const statusTone: Record<string, PillTone> = { PENDING: 'warning', REJECTED: 'error', ACTIVE: 'success', SOLD: 'warning', DELETE: 'error' };

export const PropertyPanelList = ({
	properties,
	loading,
	selected,
	onSelect,
	sellerHref,
	changeStatusHandler,
	removePropertyHandler,
}: PropertyPanelListType) => {
	const { t } = useTranslation('common');
	const ids = properties.map((property) => property._id);
	const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));

	const toggle = (id: string) => onSelect(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

	return (
		<TableScroll>
			<table className={cx(adminTable, 'md:min-w-[960px]')}>
				<thead>
					<tr>
						<th className={cx(th, 'w-[50px]')}>
							<input
								type="checkbox"
								className={checkbox}
								checked={allSelected}
								ref={(input) => {
									if (input) input.indeterminate = !allSelected && selected.length > 0;
								}}
								onChange={() => onSelect(allSelected ? [] : ids)}
								aria-label={t('Select all') as string}
							/>
						</th>
						<th className={th}>{t('CAR')}</th>
						<th className={cx(th, 'text-right')}>{t('PRICE')}</th>
						<th className={th}>{t('SELLER')}</th>
						<th className={th}>{t('LOCATION')}</th>
						<th className={th}>{t('LISTED')}</th>
						<th className={cx(th, 'text-center')}>{t('STATUS')}</th>
					</tr>
				</thead>
				<tbody>
					{properties.length === 0 && <NoRows colSpan={7}>{loading ? t('Loading...') : t('No cars found')}</NoRows>}
					{properties.map((property: Property) => {
						const image = property.propertyImages?.[0];
						const status = property.propertyStatus;
						const title = (
							<span className="flex items-center gap-3">
								{image ? (
									<img
										className={thumb}
										src={imageUrl(image)}
										alt={''}
										// missing file: keep the grey placeholder box instead of a broken-image icon
										onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
									/>
								) : (
									<span className={thumb} />
								)}
								<span>
									<strong className="text-[#0f172a]">{property.propertyTitle}</strong>
									<span className={caption}>
										{formatEnumLabel(property.carBrand)} · {property.carYear} · {formatterStr(property.carMileage)} km
									</span>
								</span>
							</span>
						);
						return (
							<tr key={property._id} className={cx(tr, selected.includes(property._id) && 'bg-[#f5f8ff]')}>
								<td className={cx(td, tdCheck)}>
									<input
										type="checkbox"
										className={checkbox}
										checked={selected.includes(property._id)}
										onChange={() => toggle(property._id)}
										aria-label={property.propertyTitle}
									/>
								</td>
								<td className={cx(td, tdTitle)}>
									{/* admins can open pending and rejected cars too */}
									{status !== PropertyStatus.DELETE ? (
										<Link href={`/property/detail?id=${property._id}`} target={'_blank'}>
											{title}
										</Link>
									) : (
										title
									)}
								</td>
								<td className={cx(td, 'text-right whitespace-nowrap')} data-label={t('PRICE')}>
									${formatterStr(property.propertyPrice)}
								</td>
								<td className={td} data-label={t('SELLER')}>
									<Link href={sellerHref(property.memberId)} className="text-[#1d4ed8]">
										{property.memberData?.memberNick ?? '-'}
									</Link>
									<span className={caption}>{t(property.memberData?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}</span>
								</td>
								<td className={td} data-label={t('LOCATION')}>
									{formatCarPlace(property, t)}
								</td>
								<td className={cx(td, 'whitespace-nowrap')} data-label={t('LISTED')}>
									{formatDate(property.createdAt, 'DD.MM.YYYY')}
								</td>
								<td className={cx(td, tdActions, 'min-w-[200px] text-center')}>
									{status === PropertyStatus.PENDING ? (
										<span className="flex justify-center gap-2">
											<button
												className={adminButton({ size: 'sm', color: 'success' })}
												onClick={() => changeStatusHandler(property, PropertyStatus.ACTIVE)}
											>
												{t('Approve')}
											</button>
											<button
												className={adminButton({ size: 'sm', variant: 'outlined', color: 'error' })}
												onClick={() => changeStatusHandler(property, PropertyStatus.REJECTED)}
											>
												{t('Reject')}
											</button>
										</span>
									) : (
										<span className="flex items-center justify-center gap-2">
											<select
												// same height as the Approve / Reject buttons, so every row has the same height
												className={cx(
													'h-8 min-w-[140px] cursor-pointer rounded-full border-0 px-3 font-sans text-xs font-semibold',
													pillTones[statusTone[status] ?? 'neutral'],
												)}
												value={status}
												onChange={(e) => changeStatusHandler(property, e.target.value as PropertyStatus)}
											>
												{Object.values(PropertyStatus).map((item) => (
													<option key={item} value={item}>
														{t(`status_${item}`)}
													</option>
												))}
											</select>
											{status === PropertyStatus.DELETE && (
												<button
													className={adminButton({ size: 'sm', variant: 'outlined', color: 'error', className: 'w-8 px-0' })}
													title={t('Remove permanently') as string}
													aria-label={t('Remove permanently') as string}
													onClick={() => removePropertyHandler(property._id)}
												>
													<DeleteIcon fontSize="small" />
												</button>
											)}
										</span>
									)}
									{status === PropertyStatus.REJECTED && property.propertyRejectReason && (
										<span
											className="mx-auto mt-1 block max-w-[220px] overflow-hidden text-xs text-ellipsis whitespace-nowrap text-[#c5221f]"
											title={property.propertyRejectReason}
										>
											{property.propertyRejectReason}
										</span>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</TableScroll>
	);
};
