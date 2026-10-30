import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AUTH_MEMBER_KEY, bearerToken, requestOf } from '../request-member';

/** login is optional: a valid token identifies the caller, a missing or invalid one means a guest */
@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = requestOf(context);
		const token = bearerToken(request);
		request[AUTH_MEMBER_KEY] = token ? await this.authService.verifyToken(token).catch(() => null) : null;
		return true;
	}
}
