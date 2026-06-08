import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'uta-cafe-backend-nest' };
  }

  @Get('api')
  apiInfo() {
    return {
      message: 'API UTA Cafe en NestJS',
      modules: ['auth', 'usuarios', 'acceso-log'],
    };
  }
}
