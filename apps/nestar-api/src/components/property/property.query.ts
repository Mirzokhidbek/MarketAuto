import { PropertiesInquiry } from '../../libs/dto/property/property.input';
import { CarAccidentHistory } from '../../libs/enums/property.enum';
import { searchRegex, shapeIntoMongoObjectId } from '../../libs/config';
import { T } from '../../libs/types/common';

/**
 * Turns the buyer's search filters into a MongoDB match. Shared by the car list and by the saved-search
 * alerts, which test a newly published car against members' saved filters.
 */
export const shapePropertyMatch = (match: T, input: PropertiesInquiry): void => {
	const {
		memberId,
		countryList,
		locationList,
		typeList,
		brandList,
		fuelList,
		transmissionList,
		periodsRange,
		pricesRange,
		yearsRange,
		mileageRange,
		options,
		text,
		model,
		noAccident,
	} = input.search;
	if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
	if (countryList && countryList.length) match.carCountry = { $in: countryList };
	if (locationList && locationList.length) match.propertyLocation = { $in: locationList };
	if (typeList && typeList.length) match.propertyType = { $in: typeList };
	if (brandList && brandList.length) match.carBrand = { $in: brandList };
	if (fuelList && fuelList.length) match.carFuel = { $in: fuelList };
	if (transmissionList && transmissionList.length) match.carTransmission = { $in: transmissionList };

	if (pricesRange) match.propertyPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
	if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
	if (yearsRange) match.carYear = { $gte: yearsRange.start, $lte: yearsRange.end };
	if (mileageRange) match.carMileage = { $gte: mileageRange.start, $lte: mileageRange.end };

	if (text) match.propertyTitle = { $regex: searchRegex(text) };
	if (model) match.carModel = { $regex: searchRegex(model) };
	if (noAccident) match.carAccidentHistory = CarAccidentHistory.NONE;
	// every ticked option must hold (barter AND customs cleared, ...)
	options?.forEach((ele) => (match[ele] = true));
};
