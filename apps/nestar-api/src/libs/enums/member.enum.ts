import { registerEnumType } from '@nestjs/graphql';

export enum MemberType {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}

registerEnumType(MemberType, {
	name: 'MemberType',
});

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

registerEnumType(MemberStatus, {
	name: 'MemberStatus',
});

export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	TELEGRAM = 'TELEGRAM',
}

registerEnumType(MemberAuthType, {
	name: 'MemberAuthType',
});

export enum VerificationPurpose {
	SIGNUP = 'SIGNUP',
	RESET_PASSWORD = 'RESET_PASSWORD',
	CHANGE_PHONE = 'CHANGE_PHONE',
	LOGIN = 'LOGIN',
}
registerEnumType(VerificationPurpose, {
	name: 'VerificationPurpose',
});
