import { z } from 'zod';
import { AgentKey, AiProvider } from '../agents/agentModelConfig';
import { generateWithModelRouter } from './modelRouter';

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model did not return JSON.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function generateStructured<T>({
  agentName,
  agentKey,
  systemPrompt,
  userPrompt,
  schema,
  provider,
  model,
  maxRetries = 3,
}: {
  agentName: string;
  agentKey: AgentKey;
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
  provider?: AiProvider;
  model?: string;
  maxRetries?: number;
}): Promise<T> {
  let prompt = `${userPrompt}\n\nReturn JSON only.`;
  let lastError = '';

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const response = await generateWithModelRouter({
      agentKey,
      systemPrompt: `${systemPrompt}\nAgent: ${agentName}. Requested provider/model: ${provider || 'route default'}/${model || 'route default'}.`,
      userMessage: prompt,
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    try {
      return schema.parse(extractJson(response.text));
    } catch (error: any) {
      lastError = error.message || 'Schema parse failed.';
      prompt = `${userPrompt}\n\nYour previous JSON was invalid for this schema. Fix it and return JSON only.\nSchema errors:\n${lastError}`;
    }
  }

  throw new Error(`Structured generation failed after ${maxRetries} attempts: ${lastError}`);
}
