import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from '@src/services/auth.service';
import { LoginDto } from '@src/dto/login.dto';
import { RegisterUserDto } from '@src/dto/register-user.dto';
import { AuthGuard } from '@src/auth/auth.guard';

interface RequestWithAuth {
  auth?: {
    id: string;
    rol: 'admin' | 'usuario';
    exp: number;
  };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Headers('user-agent') userAgent?: string) {
    const result = await this.authService.login(body.email, body.password, userAgent || 'unknown');
    if (!result) {
      throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);
    }
    return result;
  }

  @Post('logout')
  async logout(@Body() body: { userId: string; nombreUsuario: string }, @Headers('user-agent') userAgent?: string) {
    return this.authService.logout(body.userId, body.nombreUsuario, userAgent || 'unknown');
  }

  @Post('register')
  async register(@Body() body: RegisterUserDto) {
    try {
      return await this.authService.register(body);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'No se pudo registrar',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: RequestWithAuth) {
    const userId = req.auth?.id;
    if (!userId) {
      throw new UnauthorizedException('Token invalido');
    }

    const user = await this.authService.me(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no valido');
    }

    return user;
  }
}
