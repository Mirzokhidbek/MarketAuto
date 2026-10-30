import { CarCountry } from '../../enums/property.enum';
import { formatEnumLabel } from '../../utils';
import { PropertyInput } from '../../types/property/property.input';

/** form state, validation and payload of the "add / edit car" form (no React here, so it is easy to test) */
export const MAX_PHOTOS = 10;
export const MIN_PHOTOS = 3;
export const DRAFT_KEY = 'carDraft';
export const STEPS = ['Car', 'History & location', 'Photos & price'];

export const emptyCar: any = {
	propertyTitle: '',
	propertyPrice: 0,
	propertyPriceCurrency: 'USD', // the price is kept in the currency the seller typed it in
	propertyType: '',
	carCountry: '',
	propertyLocation: '',
	propertyAddress: '',
	propertyBarter: false,
	propertyNegotiable: false,
	carBrand: '',
	carModel: '',
	carYear: 0,
	carMileage: 0,
	carFuel: '',
	carTransmission: '',
	carColor: '',
	carTrim: '',
	carEngine: undefined,
	carVin: '',
	carAccidentHistory: '',
	carOwners: undefined,
	carCustomsCleared: undefined,
	carDeliveryDays: undefined,
	carDeliveryCost: undefined,
	propertyDesc: '',
	propertyImages: [],
};

// fields the form edits; everything else returned by getProperty is ignored
export const formKeys = Object.keys(emptyCar);

const VIN = /^[A-HJ-NPR-Z0-9]{17}$/i;

/** "2021 Kia K5 GT" from the fields already filled in */
export const suggestTitle = (car: any): string =>
	[car.carYear || '', formatEnumLabel(car.carBrand), car.carModel, car.carTrim].filter(Boolean).join(' ');

/** what is still missing on each step (empty list = the step is complete) */
export const missingFields = (car: any): string[][] => {
	const isUzbekistan = car.carCountry === CarCountry.UZBEKISTAN;
	return [
		[
			!car.carBrand && 'Brand',
			!car.carModel?.trim() && 'Model',
			!car.carYear && 'Year',
			!car.propertyType && 'Body type',
			!(car.carMileage >= 0) && 'Mileage',
			!car.carFuel && 'Fuel',
			!car.carTransmission && 'Transmission',
			car.carVin && !VIN.test(car.carVin) && 'VIN (17 characters)',
		].filter(Boolean) as string[],
		[
			!car.carCountry && 'Country',
			isUzbekistan && !car.propertyLocation && 'City',
			!car.propertyAddress?.trim() && (isUzbekistan ? 'District / street' : 'City abroad'),
			(car.propertyDesc?.trim().length ?? 0) < 5 && 'Description',
		].filter(Boolean) as string[],
		[
			car.propertyImages.length < MIN_PHOTOS && 'Photos',
			!(car.propertyPrice > 0) && 'Price',
			!(car.propertyTitle || suggestTitle(car)).trim() && 'Title',
		].filter(Boolean) as string[],
	];
};

/** drops empty optional fields, the city for cars abroad and delivery data for cars in Uzbekistan */
export const buildPayload = (car: any): PropertyInput => {
	const payload: any = { ...car, propertyTitle: (car.propertyTitle || suggestTitle(car)).trim() };
	delete payload.propertyPriceOriginal; // the server derives it from propertyPrice + propertyPriceCurrency
	Object.keys(payload).forEach((key) => {
		if (payload[key] === '' || payload[key] === undefined || payload[key] === null || Number.isNaN(payload[key]))
			delete payload[key];
	});
	if (payload.carCountry !== CarCountry.UZBEKISTAN) delete payload.propertyLocation;
	else {
		delete payload.carDeliveryDays;
		delete payload.carDeliveryCost;
	}
	return payload;
};
