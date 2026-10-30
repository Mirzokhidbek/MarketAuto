import { BadRequestException, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Message } from '../../libs/enums/common.enum';
import { Member } from '../../libs/dto/member/member';
import { AuthService } from './auth.service';

/**
 * The logged-in member lives on the request object itself, never in `req.body`:
 * the body is client input, so anything stored there could be forged by the caller.
 */
export const AUTH_MEMBER_KEY = 'authMember';

export interface AuthRequest {
	headers: Record<string, string | string[] | undefined>;
	[AUTH_MEMBER_KEY]?: Member | null;
}

/** the HTTP request behind a GraphQL resolver call (or a plain HTTP handler) */
export const requestOf = (context: ExecutionContext): AuthRequest =>
	context.getType<string>() === 'graphql'
		? context.getArgByIndex<{ req: AuthRequest }>(2).req
		: context.switchToHttp().getRequest<AuthRequest>();

/** "Bearer <token>" -> token; anything else -> null */
export const bearerToken = (request: AuthRequest): string | null => {
	const header = request.headers?.authorization;
	if (typeof header !== 'string') return null;
	const [scheme, token] = header.trim().split(/\s+/);
	return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

/** verifies the bearer token; throws 400 without a token and 401 for an invalid or blocked one */
export const authenticate = async (request: AuthRequest, authService: AuthService): Promise<Member> => {
	const token = bearerToken(request);
	if (!token) throw new BadRequestException(Message.TOKEN_NOT_EXIST);
	try {
		return await authService.verifyToken(token);
	} catch (err) {
		throw err instanceof UnauthorizedException ? err : new UnauthorizedException(Message.NOT_AUTHENTICATED);
	}
};
