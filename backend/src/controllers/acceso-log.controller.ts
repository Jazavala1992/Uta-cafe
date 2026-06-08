import { Controller, Get } from '@nestjs/common';
import { AccesoLogService } from '@src/services/acceso-log.service';

@Controller('api/acceso-log')
export class AccesoLogController {
  constructor(private readonly accesoLogService: AccesoLogService) {}

  @Get()
  async getAll() {
    return this.accesoLogService.getAll();
  }
}
