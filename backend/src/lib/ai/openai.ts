import OpenAI from 'openai';
import { AiProviderClient, AiRequest, AiResponse, estimateTokens } from './provider';

export const openaiProvider: AiProviderClient = {
  provider: 'openai',
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  async generate(request: AiRequest): Promise<AiResponse> {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing.');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: request.model || process.env.OPENAI_MODEL || 'gpt-4.1',
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature ?? 0.35,
      max_tokens: request.maxOutputTokens ?? 8192,
      response_format: { type: 'json_object' },
    });
    const text = completion.choices[0]?.message?.content || '{}';
    return {
      text,
      provider: 'openai',
      model: request.model,
      promptTokensEstimate: estimateTokens(`${request.systemPrompt}\n${request.userPrompt}`),
      outputTokensEstimate: estimateTokens(text),
    };
  },
};
