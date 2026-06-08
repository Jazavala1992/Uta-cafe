import { api } from './api';

interface AiChatPayload {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AiChatResponse {
  reply: string;
  provider: string;
  model: string;
  tokens?: number;
}

interface AiStatusResponse {
  provider: string;
  model: string;
  baseUrl: string;
}

export const aiService = {
  async getStatus(): Promise<AiStatusResponse> {
    const { data } = await api.get<AiStatusResponse>('/ai/status');
    return data;
  },

  async chat(payload: AiChatPayload): Promise<AiChatResponse> {
    const { data } = await api.post<AiChatResponse>('/ai/chat', payload);
    return data;
  },
};
