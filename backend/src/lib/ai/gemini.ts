import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProviderClient, AiRequest, AiResponse, estimateTokens } from './provider';

export const geminiProvider: AiProviderClient = {
  provider: 'gemini',
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  async generate(request: AiRequest): Promise<AiResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: request.model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      systemInstruction: request.systemPrompt,
      generationConfig: {
        temperature: request.temperature ?? 0.35,
        maxOutputTokens: request.maxOutputTokens ?? 8192,
        responseMimeType: 'application/json',
      },
    });

    const response = await model.generateContent(request.userPrompt);
    const text = response.response.text();
    return {
      text,
      provider: 'gemini',
      model: request.model,
      promptTokensEstimate: estimateTokens(`${request.systemPrompt}\n${request.userPrompt}`),
      outputTokensEstimate: estimateTokens(text),
    };
  },
};
