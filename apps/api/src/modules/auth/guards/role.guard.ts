import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Type,
} from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import type { JwtPayload } from '../types/jwt-payload.type';

export const createRoleGuard = (
  requiredRoles: UserRole[],
): Type<CanActivate> => {
  class RoleGuardImpl implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context
        .switchToHttp()
        .getRequest<{ user?: JwtPayload }>();
      const user: JwtPayload | undefined = request.user;

      if (!user) {
        throw new ForbiddenException('User not found in request');
      }

      if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException(
          `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
        );
      }

      return true;
    }
  }

  return RoleGuardImpl;
};
