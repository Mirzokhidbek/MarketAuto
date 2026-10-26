import { SetMetadata } from '@nestjs/common';

/** only SUPER admins (not moderators); use together with @Roles(MemberType.ADMIN) + RolesGuard */
export const SuperAdminOnly = () => SetMetadata('superAdmin', true);
