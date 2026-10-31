import { Field, ObjectType } from '@nestjs/graphql';

/** one logged-in device of the member (Profile → Devices) */
@ObjectType()
export class MemberSession {
	@Field(() => String)
	_id!: string;

	/** browser identification string as sent at login; the site shows it as "Chrome · Windows" */
	@Field(() => String)
	userAgent!: string;

	@Field(() => Date)
	startedAt!: Date;

	@Field(() => Date)
	lastActiveAt!: Date;

	/** the device making this request */
	@Field(() => Boolean)
	current!: boolean;
}
