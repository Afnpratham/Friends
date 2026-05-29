import { AiProviderClient, AiRequest, AiResponse, estimateTokens } from './provider';

export const mockProvider: AiProviderClient = {
  provider: 'mock',
  isConfigured: () => true,
  async generate(request: AiRequest): Promise<AiResponse> {
    const text = JSON.stringify({
      summary: 'Deterministic mock provider response generated from the selected template and prompt context.',
      promptPreview: request.userPrompt.slice(0, 500),
    });
    return {
      text,
      provider: 'mock',
      model: request.model || 'mock-deterministic-v1',
      promptTokensEstimate: estimateTokens(`${request.systemPrompt}\n${request.userPrompt}`),
      outputTokensEstimate: estimateTokens(text),
    };
  },
};
