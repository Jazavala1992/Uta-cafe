export class ChatDto {
  prompt!: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
