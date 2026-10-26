import { useTranslation } from 'next-i18next';
import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import {
	Button,
	Checkbox,
	MenuItem,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Property } from '../../../types/property/property';
import { PropertyStatus } from '../../../enums/property.enum';
import { formatCarPlace, formatEnumLabel, formatterStr, imageUrl } from '../../../utils';

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

const statusClass: Record<string, string> = { PENDING: 'warning', REJECTED: 'error', ACTIVE: 'success', SOLD: 'warning', DELETE: 'error' };

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
		<TableContainer>
			<Table sx={{ minWidth: 960 }} size={'medium'}>
				<TableHead>
					<TableRow>
						<TableCell padding="checkbox">
							<Checkbox
								checked={allSelected}
								indeterminate={!allSelected && selected.length > 0}
								onChange={() => onSelect(allSelected ? [] : ids)}
								inputProps={{ 'aria-label': t('Select all') as string }}
							/>
						</TableCell>
						<TableCell>{t('CAR')}</TableCell>
						<TableCell align="right">{t('PRICE')}</TableCell>
						<TableCell>{t('SELLER')}</TableCell>
						<TableCell>{t('LOCATION')}</TableCell>
						<TableCell>{t('LISTED')}</TableCell>
						<TableCell align="center">{t('STATUS')}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{properties.length === 0 && (
						<TableRow>
							<TableCell align="center" colSpan={7}>
								<span className={'no-data'}>{loading ? t('Loading...') : t('No cars found')}</span>
							</TableCell>
						</TableRow>
					)}

					{properties.map((property: Property) => {
						const image = property.propertyImages?.[0];
						const status = property.propertyStatus;
						const title = (
							<Stack direction={'row'} alignItems={'center'} gap={1.5}>
								{image ? (
									<img
										className={'ma-admin-thumb'}
										src={imageUrl(image)}
										alt={''}
										// missing file: keep the grey placeholder box instead of a broken-image icon
										onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
									/>
								) : (
									<span className={'ma-admin-thumb'} />
								)}
								<span>
									<strong>{property.propertyTitle}</strong>
									<Typography variant="caption" display="block" color="text.secondary">
										{formatEnumLabel(property.carBrand)} · {property.carYear} · {formatterStr(property.carMileage)} km
									</Typography>
								</span>
							</Stack>
						);

						return (
							<TableRow hover key={property._id} selected={selected.includes(property._id)}>
								<TableCell padding="checkbox">
									<Checkbox checked={selected.includes(property._id)} onChange={() => toggle(property._id)} />
								</TableCell>
								<TableCell className={'name'}>
									{/* admins can open pending and rejected cars too */}
									{status !== PropertyStatus.DELETE ? (
										<Link href={`/property/detail?id=${property._id}`} target={'_blank'}>
											{title}
										</Link>
									) : (
										title
									)}
								</TableCell>
								<TableCell align="right">${formatterStr(property.propertyPrice)}</TableCell>
								<TableCell>
									<Link href={sellerHref(property.memberId)}>{property.memberData?.memberNick ?? '-'}</Link>
									<Typography variant="caption" display="block" color="text.secondary">
										{t(property.memberData?.memberType === 'AGENT' ? 'Dealer' : 'Private seller')}
									</Typography>
								</TableCell>
								<TableCell>{formatCarPlace(property)}</TableCell>
								<TableCell>{moment(property.createdAt).format('DD.MM.YYYY')}</TableCell>
								<TableCell align="center">
									{status === PropertyStatus.PENDING ? (
										<Stack direction={'row'} gap={1} justifyContent={'center'}>
											<Button
												size="small"
												color="success"
												variant="contained"
												onClick={() => changeStatusHandler(property, PropertyStatus.ACTIVE)}
											>
												{t('Approve')}
											</Button>
											<Button
												size="small"
												color="error"
												variant="outlined"
												onClick={() => changeStatusHandler(property, PropertyStatus.REJECTED)}
											>
												{t('Reject')}
											</Button>
										</Stack>
									) : (
										<Stack direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
											<Select
												size="small"
												className={`badge ${statusClass[status]}`}
												value={status}
												onChange={(e) => changeStatusHandler(property, e.target.value as PropertyStatus)}
											>
												{Object.values(PropertyStatus).map((item) => (
													<MenuItem key={item} value={item}>
														{t(`status_${item}`)}
													</MenuItem>
												))}
											</Select>
											{status === PropertyStatus.DELETE && (
												<Button
													color="error"
													variant="outlined"
													size="small"
													title={t('Remove permanently') as string}
													onClick={() => removePropertyHandler(property._id)}
												>
													<DeleteIcon fontSize="small" />
												</Button>
											)}
										</Stack>
									)}
									{status === PropertyStatus.REJECTED && property.propertyRejectReason && (
										<Typography variant="caption" display="block" color="error" sx={{ mt: 0.5, maxWidth: 220, mx: 'auto' }}>
											{property.propertyRejectReason}
										</Typography>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
