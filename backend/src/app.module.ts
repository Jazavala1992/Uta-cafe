import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccesoLogModule } from './acceso-log/acceso-log.module';
import { DataModule } from './data/data.module';
import { AiModule } from './ai/ai.module';

@Module({
	imports: [ConfigModule, CommonModule, AuthModule, UsersModule, AccesoLogModule, DataModule, AiModule],
	controllers: [AppController],
})
export class AppModule {}
