import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { WithoutGuard } from './without.guard';
import { bearerToken } from '../request-member';
import { AuthService } from '../auth.service';

const MEMBER = { _id: 'm1', memberNick: 'ali', memberType: 'USER' };
const ADMIN_MOD = { _id: 'a1', memberNick: 'mod', memberType: 'ADMIN', memberAdminRole: 'MODERATOR' };

const authService = (member: unknown = MEMBER) =>
	({
		verifyToken: jest.fn(async (token: string) => {
			if (token !== 'good') throw new Error('jwt malformed');
			return member;
		}),
	}) as unknown as AuthService;

const gqlContext = (req: Record<string, unknown>) =>
	({
		getType: () => 'graphql',
		getArgByIndex: () => ({ req }),
		getHandler: () => () => undefined,
	}) as any;

const reflector = (meta: Record<string, unknown>) => ({ get: (key: string) => meta[key] }) as unknown as Reflector;

describe('bearerToken', () => {
	it('accepts only the Bearer scheme', () => {
		expect(bearerToken({ headers: { authorization: 'Bearer abc' } })).toBe('abc');
		expect(bearerToken({ headers: { authorization: 'bearer  abc' } })).toBe('abc');
		expect(bearerToken({ headers: { authorization: 'Basic abc' } })).toBeNull();
		expect(bearerToken({ headers: { authorization: 'abc' } })).toBeNull();
		expect(bearerToken({ headers: {} })).toBeNull();
	});
});

describe('AuthGuard', () => {
	it('stores the verified member on the request, not in the client body', async () => {
		const req: any = { headers: { authorization: 'Bearer good' }, body: { authMember: { _id: 'forged' } } };
		await new AuthGuard(authService()).canActivate(gqlContext(req));
		expect(req.authMember).toEqual(MEMBER);
		expect(req.body.authMember).toEqual({ _id: 'forged' }); // untouched and never read
	});

	it('rejects a missing token and an invalid one', async () => {
		await expect(new AuthGuard(authService()).canActivate(gqlContext({ headers: {} }))).rejects.toBeInstanceOf(
			BadRequestException,
		);
		await expect(
			new AuthGuard(authService()).canActivate(gqlContext({ headers: { authorization: 'Bearer bad' } })),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});
});

describe('WithoutGuard', () => {
	it('treats a forged body member as a guest', async () => {
		const req: any = { headers: {}, body: { authMember: { _id: 'forged', memberType: 'ADMIN' } } };
		await new WithoutGuard(authService()).canActivate(gqlContext(req));
		expect(req.authMember).toBeNull();
	});

	it('treats an invalid token as a guest', async () => {
		const req: any = { headers: { authorization: 'Bearer bad' } };
		await expect(new WithoutGuard(authService()).canActivate(gqlContext(req))).resolves.toBe(true);
		expect(req.authMember).toBeNull();
	});
});

describe('RolesGuard', () => {
	it('allows a listed role', async () => {
		const req: any = { headers: { authorization: 'Bearer good' } };
		await new RolesGuard(reflector({ roles: ['USER'] }), authService()).canActivate(gqlContext(req));
		expect(req.authMember).toEqual(MEMBER);
	});

	it('forbids other roles and moderators on super-admin resolvers', async () => {
		const req = { headers: { authorization: 'Bearer good' } };
		await expect(
			new RolesGuard(reflector({ roles: ['ADMIN'] }), authService()).canActivate(gqlContext(req)),
		).rejects.toBeInstanceOf(ForbiddenException);
		await expect(
			new RolesGuard(reflector({ roles: ['ADMIN'], superAdmin: true }), authService(ADMIN_MOD)).canActivate(
				gqlContext(req),
			),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it('still requires a login when @Roles is missing', async () => {
		await expect(
			new RolesGuard(reflector({}), authService()).canActivate(gqlContext({ headers: {} })),
		).rejects.toBeInstanceOf(BadRequestException);
	});
});
