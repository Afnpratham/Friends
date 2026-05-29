import { AiProviderClient, AiRequest, AiResponse, estimateTokens } from './provider';

export const anthropicProvider: AiProviderClient = {
  provider: 'anthropic',
  isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  async generate(request: AiRequest): Promise<AiResponse> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is missing.');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        system: `${request.systemPrompt}\nReturn JSON only.`,
        messages: [{ role: 'user', content: request.userPrompt }],
        temperature: request.temperature ?? 0.35,
        max_tokens: request.maxOutputTokens ?? 8192,
      }),
    });
    if (!response.ok) throw new Error(`Anthropic request failed: HTTP ${response.status}`);
    const json = await response.json() as { content?: Array<{ text?: string }> };
    const text = json.content?.map((part) => part.text || '').join('\n') || '{}';
    return {
      text,
      provider: 'anthropic',
      model: request.model,
      promptTokensEstimate: estimateTokens(`${request.systemPrompt}\n${request.userPrompt}`),
      outputTokensEstimate: estimateTokens(text),
    };
  },
};
