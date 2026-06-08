import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EnvService {
  readonly port: number = Number(process.env.PORT || 3000);
  readonly nodeEnv: string = process.env.NODE_ENV || 'development';
  readonly databaseUrl: string =
    process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/uta_cafe';
  readonly jwtSecret: string = process.env.JWT_SECRET || 'dev-secret';
  readonly corsOrigin: string = process.env.CORS_ORIGIN || 'http://localhost:5173';
  readonly aiProvider: string = process.env.AI_PROVIDER || 'ollama';
  readonly ollamaBaseUrl: string = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  readonly ollamaModel: string = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  readonly aiTimeoutMs: number = Number(process.env.AI_TIMEOUT_MS || 60000);
  // Máximo de items de contexto que se incluirán en prompts para ahorrar tokens
  readonly aiContextMaxItems: number = Number(process.env.AI_CONTEXT_MAX_ITEMS || 30);

  // Credenciales del seed
  readonly adminPassword: string = process.env.ADMIN_PASSWORD || 'Admin123!';
  readonly cajeroPassword: string = process.env.CAJERO_PASSWORD || 'Cajero123!';
}
