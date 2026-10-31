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
	ADMIN_2FA = 'ADMIN_2FA', // second step of an admin login
	VERIFY_EMAIL = 'VERIFY_EMAIL', // adding or changing the email of an account
}
registerEnumType(VerificationPurpose, {
	name: 'VerificationPurpose',
});

/** SUPER: everything; MODERATOR: listings, reports, community and support, but not members, settings or the log */
export enum AdminRole {
	SUPER = 'SUPER',
	MODERATOR = 'MODERATOR',
}
registerEnumType(AdminRole, {
	name: 'AdminRole',
});
