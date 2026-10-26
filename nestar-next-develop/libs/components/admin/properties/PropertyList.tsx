import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import {
	Button,
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
import { REACT_APP_API_URL } from '../../../config';
import { formatCarPlace, formatEnumLabel, formatterStr, imageUrl } from '../../../utils';

interface PropertyPanelListType {
	properties: Property[];
	loading?: boolean;
	updatePropertyHandler: (input: { _id: string; propertyStatus: PropertyStatus }) => void;
	removePropertyHandler: (id: string) => void;
}

const statusClass: Record<string, string> = { ACTIVE: 'success', SOLD: 'warning', DELETE: 'error' };

export const PropertyPanelList = ({
	properties,
	loading,
	updatePropertyHandler,
	removePropertyHandler,
}: PropertyPanelListType) => {
	return (
		<TableContainer>
			<Table sx={{ minWidth: 900 }} size={'medium'}>
				<TableHead>
					<TableRow>
						<TableCell>CAR</TableCell>
						<TableCell align="right">PRICE</TableCell>
						<TableCell>SELLER</TableCell>
						<TableCell>LOCATION</TableCell>
						<TableCell>LISTED</TableCell>
						<TableCell align="center">STATUS</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{properties.length === 0 && (
						<TableRow>
							<TableCell align="center" colSpan={6}>
								<span className={'no-data'}>{loading ? 'Loading...' : 'No cars found'}</span>
							</TableCell>
						</TableRow>
					)}

					{properties.map((property: Property) => {
						const image = property.propertyImages?.[0];
						const viewable = property.propertyStatus !== PropertyStatus.DELETE;
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
										{formatEnumLabel(property.carBrand)} · {property.carYear} · {property._id}
									</Typography>
								</span>
							</Stack>
						);

						return (
							<TableRow hover key={property._id}>
								<TableCell className={'name'}>
									{viewable ? <Link href={`/property/detail?id=${property._id}`}>{title}</Link> : title}
								</TableCell>
								<TableCell align="right">${formatterStr(property.propertyPrice)}</TableCell>
								<TableCell>
									<Link href={`/member?memberId=${property.memberId}`}>{property.memberData?.memberNick ?? '-'}</Link>
									<Typography variant="caption" display="block" color="text.secondary">
										{property.memberData?.memberType === 'AGENT' ? 'Dealer' : 'Private seller'}
									</Typography>
								</TableCell>
								<TableCell>{formatCarPlace(property)}</TableCell>
								<TableCell>{moment(property.createdAt).format('DD.MM.YYYY')}</TableCell>
								<TableCell align="center">
									<Stack direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
										<Select
											size="small"
											className={`badge ${statusClass[property.propertyStatus]}`}
											value={property.propertyStatus}
											onChange={(e) =>
												updatePropertyHandler({ _id: property._id, propertyStatus: e.target.value as PropertyStatus })
											}
										>
											{Object.values(PropertyStatus).map((status) => (
												<MenuItem key={status} value={status}>
													{status}
												</MenuItem>
											))}
										</Select>
										{property.propertyStatus === PropertyStatus.DELETE && (
											<Button
												color="error"
												variant="outlined"
												size="small"
												title="Remove permanently"
												onClick={() => removePropertyHandler(property._id)}
											>
												<DeleteIcon fontSize="small" />
											</Button>
										)}
									</Stack>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
