export interface EnvConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  corsOrigin: string;
  aiProvider: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  aiTimeoutMs: number;
}
