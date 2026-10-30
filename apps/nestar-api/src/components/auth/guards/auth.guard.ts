import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AUTH_MEMBER_KEY, authenticate, requestOf } from '../request-member';

/** the caller must be logged in */
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = requestOf(context);
		request[AUTH_MEMBER_KEY] = await authenticate(request, this.authService);
		return true;
	}
}
