import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AUTH_MEMBER_KEY, requestOf } from '../request-member';

/**
 * The member set by AuthGuard / RolesGuard / WithoutGuard (null for guests and unguarded resolvers).
 * @AuthMember('_id') returns one field.
 */
export const AuthMember = createParamDecorator((field: string | undefined, context: ExecutionContext) => {
	const member = requestOf(context)[AUTH_MEMBER_KEY] as Record<string, unknown> | null | undefined;
	if (!member) return null;
	return field ? member[field] : member;
});
