import { AdminRole, MemberStatus, MemberType } from '../../enums/member.enum';
import { MemberUpdate, pickSelfEditable } from './member.update';

describe('pickSelfEditable', () => {
	it('keeps profile fields and drops role, admin role, badges, status, phone and password', () => {
		const input = {
			_id: 'x',
			memberNick: 'ali',
			memberFullName: 'Ali Valiyev',
			memberImage: 'uploads/member/a.webp',
			memberAddress: 'Toshkent',
			memberDesc: 'salom',
			memberType: MemberType.ADMIN,
			memberStatus: MemberStatus.ACTIVE,
			memberAdminRole: AdminRole.SUPER,
			memberTrusted: true,
			memberDealerVerified: true,
			memberBlockReason: 'x',
			memberPhone: '998901234567',
			memberPassword: '12345',
		} as unknown as MemberUpdate;

		expect(pickSelfEditable(input)).toEqual({
			memberNick: 'ali',
			memberFullName: 'Ali Valiyev',
			memberImage: 'uploads/member/a.webp',
			memberAddress: 'Toshkent',
			memberDesc: 'salom',
		});
	});

	it('does not add fields that were not sent', () => {
		expect(pickSelfEditable({ _id: 'x', memberDesc: '' } as unknown as MemberUpdate)).toEqual({ memberDesc: '' });
	});
});
