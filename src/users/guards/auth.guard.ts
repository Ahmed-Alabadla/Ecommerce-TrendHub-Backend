import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JWTPayload } from 'src/utils/types';
import { CURRENT_USER_KEY } from 'src/utils/constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token)
      throw new UnauthorizedException('Invalid or missing Bearer token');

    try {
      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      request[CURRENT_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException('Access denied, Invalid token');
    }

    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
