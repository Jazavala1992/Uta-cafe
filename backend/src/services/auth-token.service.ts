import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnvService } from '../config/env.service';

interface TokenPayload {
  id: string;
  rol: 'admin' | 'usuario';
  exp: number;
}

@Injectable()
export class AuthTokenService {
  constructor(private readonly env: EnvService) {}

  private toBase64Url(value: string) {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private fromBase64Url(value: string) {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  private signSegment(input: string) {
    return createHmac('sha256', this.env.jwtSecret).update(input).digest('base64url');
  }

  createToken(user: { id: string; rol: 'admin' | 'usuario' }, ttlMs = 8 * 3600 * 1000) {
    const header = this.toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload: TokenPayload = {
      id: user.id,
      rol: user.rol,
      exp: Date.now() + ttlMs,
    };
    const payloadEncoded = this.toBase64Url(JSON.stringify(payload));
    const signedData = `${header}.${payloadEncoded}`;
    const signature = this.signSegment(signedData);
    return `${signedData}.${signature}`;
  }

  verifyToken(token: string): TokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expected = this.signSegment(`${header}.${payload}`);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

    try {
      const decodedPayload = JSON.parse(this.fromBase64Url(payload)) as TokenPayload;
      if (!decodedPayload?.id || !decodedPayload?.rol || !decodedPayload?.exp) return null;
      if (decodedPayload.exp < Date.now()) return null;
      return decodedPayload;
    } catch {
      return null;
    }
  }
}
