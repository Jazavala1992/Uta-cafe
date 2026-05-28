import { Module } from '@nestjs/common';
import { AccesoLogController } from './acceso-log.controller';
import { AccesoLogService } from './acceso-log.service';

@Module({
  controllers: [AccesoLogController],
  providers: [AccesoLogService],
  exports: [AccesoLogService],
})
export class AccesoLogModule {}
