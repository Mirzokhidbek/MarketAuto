import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';
import { AdminRole } from '../../../libs/enums/member.enum';
import { AUTH_MEMBER_KEY, authenticate, requestOf } from '../request-member';

/** the caller must be logged in and have one of the @Roles(...); @SuperAdminOnly() also excludes moderators */
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());
		const request = requestOf(context);
		const member = await authenticate(request, this.authService);

		// a RolesGuard without @Roles(...) still requires a login; it never lets anonymous callers through
		if (roles?.length && !roles.includes(member.memberType))
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);
		const superOnly = this.reflector.get<boolean>('superAdmin', context.getHandler());
		if (superOnly && member.memberAdminRole === AdminRole.MODERATOR)
			throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		request[AUTH_MEMBER_KEY] = member;
		return true;
	}
}
