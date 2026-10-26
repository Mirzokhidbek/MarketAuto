import { registerEnumType } from '@nestjs/graphql';

/** Car body type **/
export enum PropertyType {
	SEDAN = 'SEDAN',
	SUV = 'SUV',
	HATCHBACK = 'HATCHBACK',
	MINIVAN = 'MINIVAN',
	PICKUP = 'PICKUP',
	COUPE = 'COUPE',
	WAGON = 'WAGON',
	CONVERTIBLE = 'CONVERTIBLE',
}
registerEnumType(PropertyType, {
	name: 'PropertyType',
});

export enum PropertyStatus {
	PENDING = 'PENDING', // waiting for admin approval (listings of new, not yet trusted members)
	REJECTED = 'REJECTED', // moderation said no (see propertyRejectReason); the owner can fix it and resubmit
	ACTIVE = 'ACTIVE',
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(PropertyStatus, {
	name: 'PropertyStatus',
});

export enum PropertyLocation {
	TASHKENT = 'TASHKENT',
	TASHKENT_REGION = 'TASHKENT_REGION',
	SAMARKAND = 'SAMARKAND',
	BUKHARA = 'BUKHARA',
	ANDIJAN = 'ANDIJAN',
	NAMANGAN = 'NAMANGAN',
	FERGANA = 'FERGANA',
	NAVOI = 'NAVOI',
	KARSHI = 'KARSHI',
	TERMEZ = 'TERMEZ',
	JIZZAKH = 'JIZZAKH',
	GULISTAN = 'GULISTAN',
	URGENCH = 'URGENCH',
	NUKUS = 'NUKUS',
}
registerEnumType(PropertyLocation, {
	name: 'PropertyLocation',
});

export enum CarCountry {
	UZBEKISTAN = 'UZBEKISTAN',
	SOUTH_KOREA = 'SOUTH_KOREA',
	CHINA = 'CHINA',
	JAPAN = 'JAPAN',
	USA = 'USA',
	GERMANY = 'GERMANY',
	UAE = 'UAE',
	OTHER = 'OTHER',
}
registerEnumType(CarCountry, {
	name: 'CarCountry',
});

export enum CarBrand {
	CHEVROLET = 'CHEVROLET',
	KIA = 'KIA',
	HYUNDAI = 'HYUNDAI',
	TOYOTA = 'TOYOTA',
	BYD = 'BYD',
	CHERY = 'CHERY',
	HAVAL = 'HAVAL',
	LADA = 'LADA',
	NISSAN = 'NISSAN',
	HONDA = 'HONDA',
	VOLKSWAGEN = 'VOLKSWAGEN',
	MERCEDES_BENZ = 'MERCEDES_BENZ',
	BMW = 'BMW',
	AUDI = 'AUDI',
	LEXUS = 'LEXUS',
	OTHER = 'OTHER',
}
registerEnumType(CarBrand, {
	name: 'CarBrand',
});

export enum CarFuel {
	PETROL = 'PETROL',
	DIESEL = 'DIESEL',
	GAS = 'GAS',
	HYBRID = 'HYBRID',
	ELECTRIC = 'ELECTRIC',
}
registerEnumType(CarFuel, {
	name: 'CarFuel',
});

export enum CarTransmission {
	MANUAL = 'MANUAL',
	AUTOMATIC = 'AUTOMATIC',
	ROBOT = 'ROBOT',
	CVT = 'CVT',
}
registerEnumType(CarTransmission, {
	name: 'CarTransmission',
});

export enum CarAccidentHistory {
	NONE = 'NONE',
	MINOR = 'MINOR',
	SERIOUS = 'SERIOUS',
}
registerEnumType(CarAccidentHistory, {
	name: 'CarAccidentHistory',
});

export enum ReportReason {
	FAKE = 'FAKE',
	WRONG_PRICE = 'WRONG_PRICE',
	ALREADY_SOLD = 'ALREADY_SOLD',
	DUPLICATE = 'DUPLICATE',
	SPAM = 'SPAM',
	OTHER = 'OTHER',
}
registerEnumType(ReportReason, {
	name: 'ReportReason',
});

export enum ReportStatus {
	OPEN = 'OPEN',
	RESOLVED = 'RESOLVED',
}
registerEnumType(ReportStatus, {
	name: 'ReportStatus',
});

/** currency the seller typed the price in; propertyPrice itself is always USD (search, sorting) */
export enum PriceCurrency {
	USD = 'USD',
	UZS = 'UZS',
}
registerEnumType(PriceCurrency, {
	name: 'PriceCurrency',
});
