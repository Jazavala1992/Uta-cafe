import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

interface RequestWithAuth {
  headers?: {
    authorization?: string;
  };
  auth?: {
    id: string;
    rol: 'admin' | 'usuario';
    exp: number;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const rawHeader = req.headers.authorization;

    if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = rawHeader.slice(7).trim();
    const payload = this.tokenService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    req.auth = payload;
    return true;
  }
}
