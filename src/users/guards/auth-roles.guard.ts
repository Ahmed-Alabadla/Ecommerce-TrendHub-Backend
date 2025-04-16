import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JWTPayload } from 'src/utils/types';
import { CURRENT_USER_KEY } from 'src/utils/constants';
import { Reflector } from '@nestjs/core';
import { UserType } from 'src/utils/enums';
import { ROLES_KEY } from '../decorators/user-role.decorator';
import { UsersService } from '../users.service';

@Injectable()
export class AuthRolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) return false;

    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token)
      throw new UnauthorizedException('Invalid or missing Bearer token');

    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.id);
      if (!user) return false;

      if (!roles.includes(user.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }
      request[CURRENT_USER_KEY] = payload;
      return true;
    } catch (err) {
      console.log(err);

      throw new UnauthorizedException('Access denied, Invalid token');
    }
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
