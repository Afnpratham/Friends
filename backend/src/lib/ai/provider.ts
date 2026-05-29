import { AiProvider } from '../agents/agentModelConfig';

export interface AiRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AiResponse {
  text: string;
  provider: AiProvider;
  model: string;
  promptTokensEstimate?: number;
  outputTokensEstimate?: number;
}

export interface AiProviderClient {
  provider: AiProvider;
  isConfigured(): boolean;
  generate(request: AiRequest): Promise<AiResponse>;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
