import { registerEnumType } from '@nestjs/graphql';

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NO_DATA_FOUND = 'No data found!',
	CREATE_FAILED = 'Create failed!',
	UPDATE_FAILED = 'Update failed!',
	REMOVE_FAILED = 'Remove failed!',
	UPLOAD_FAILED = 'Upload failed!',
	BAD_REQUEST = 'Bad Request',

	USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
	NO_MEMBER_NICK = 'No member with that member nick!',
	BLOCKED_USER = 'You have been blocked!',
	WRONG_PASSWORD = 'Wrong password, try again!',
	NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
	TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
	NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
	PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg or png images!',
	SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
	SELF_LIKE_DENIED = 'You cannot like yourself!',
	WRONG_CURRENT_PASSWORD = 'Current password is incorrect!',
	INVALID_UPLOAD_TARGET = 'Invalid upload target!',
	TOO_MANY_ATTEMPTS = 'Too many attempts. Please try again later.',
	INVALID_PHONE = 'Please enter a valid phone number with country code!',
	WRONG_CODE = 'The code is wrong or expired!',
	CODE_NOT_SENT = 'Could not send the SMS code. Please try again later.',
	DUPLICATE_LISTING = 'You have already listed this car!',
	SESSION_EXPIRED = 'Your session has expired, please login again!',
	NOT_PARTICIPANT = 'You are not part of this conversation!',
	ALREADY_REPORTED = 'You have already reported this listing.',
}

export enum Direction {
	ASC = 1,
	DESC = -1,
}
registerEnumType(Direction, {
	name: 'Direction',
});
