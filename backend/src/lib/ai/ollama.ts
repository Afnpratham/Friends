import { AiProviderClient, AiRequest, AiResponse, estimateTokens } from './provider';

export const ollamaProvider: AiProviderClient = {
  provider: 'ollama',
  isConfigured: () => true,
  async generate(request: AiRequest): Promise<AiResponse> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: request.model || process.env.OLLAMA_MODEL || 'qwen3-coder:30b',
          messages: [
            { role: 'system', content: `${request.systemPrompt}\nReturn JSON only.` },
            { role: 'user', content: request.userPrompt },
          ],
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens ?? 8192,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content || '{}';
      return {
        text,
        provider: 'ollama',
        model: request.model,
        promptTokensEstimate: estimateTokens(`${request.systemPrompt}\n${request.userPrompt}`),
        outputTokensEstimate: estimateTokens(text),
      };
    } catch (error: any) {
      throw new Error(`Ollama is not running. Start it with ollama serve or switch provider. ${error.message || ''}`.trim());
    }
  },
};
