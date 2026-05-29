import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import OpenAI from 'openai';
import { AgentKey, agentModelConfig, AiProvider } from '../agents/agentModelConfig';
import { generateMockAgentOutput } from '../../services/mockAiService';

export interface RoutedModelRequest {
  agentKey: AgentKey;
  systemPrompt: string;
  userMessage: string;
  userApiKey?: string | null;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface RoutedModelResponse {
  text: string;
  requestedProvider: AiProvider;
  requestedModel: string;
  provider: AiProvider;
  model: string;
  usedFallback: boolean;
  promptTokensEstimate: number;
  completionTokensEstimate: number;
  totalTokensEstimate: number;
  costEstimateUsd: number | null;
}

const providerKeyEnv: Record<AiProvider, string | null> = {
  gemini: 'GEMINI_API_KEY',
  ollama: null,
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  groq: 'GROQ_API_KEY',
  mock: null,
};

const providerModelEnv: Record<AiProvider, string | null> = {
  gemini: 'GEMINI_MODEL',
  ollama: 'OLLAMA_MODEL',
  openai: 'OPENAI_MODEL',
  anthropic: 'ANTHROPIC_MODEL',
  groq: 'GROQ_MODEL',
  mock: null,
};

const defaultModels: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-pro',
  ollama: 'qwen3-coder:30b',
  openai: 'gpt-4.1',
  anthropic: 'claude-3-5-sonnet-latest',
  groq: 'llama-3.3-70b-versatile',
  mock: 'mock-deterministic-v1',
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function getEnvProvider(value?: string | null): AiProvider {
  const provider = (value || '').toLowerCase();
  if (provider === 'openai' || provider === 'anthropic' || provider === 'groq' || provider === 'ollama' || provider === 'mock') return provider;
  return 'gemini';
}

function getProviderKey(provider: AiProvider, userApiKey?: string | null): string | null {
  if (provider === 'gemini' && userApiKey) return userApiKey;
  const envName = providerKeyEnv[provider];
  return envName ? process.env[envName] || null : null;
}

function canUseProvider(provider: AiProvider, userApiKey?: string | null): boolean {
  if (provider === 'mock') return true;
  if (provider === 'ollama') return true;
  return Boolean(getProviderKey(provider, userApiKey));
}

function resolveRoute(agentKey: AgentKey, userApiKey?: string | null) {
  const configured = agentModelConfig[agentKey];
  const defaultProvider = getEnvProvider(process.env.AI_PROVIDER_DEFAULT || process.env.AI_PROVIDER || 'gemini');
  const requestedProvider = configured.provider;
  const requestedModel = configured.model;

  let provider = requestedProvider;
  let usedFallback = false;

  if (!canUseProvider(provider, userApiKey)) {
    provider = defaultProvider;
    usedFallback = provider !== requestedProvider;
  }

  if (!canUseProvider(provider, userApiKey)) {
    provider = 'mock';
    usedFallback = true;
  }

  const modelEnv = providerModelEnv[provider];
  const model = provider === requestedProvider
    ? requestedModel
    : modelEnv
      ? process.env[modelEnv] || defaultModels[provider]
      : defaultModels[provider];

  return { requestedProvider, requestedModel, provider, model, usedFallback };
}

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxOutputTokens: number
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    safetySettings,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.9,
    },
  });

  const result = await geminiModel.generateContent(userMessage);
  return result.response.text();
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxOutputTokens: number,
  baseURL?: string
): Promise<string> {
  const client = new OpenAI({ apiKey, baseURL });
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
    max_tokens: maxOutputTokens,
  });

  return completion.choices[0]?.message?.content || '';
}

async function callOllama(
  systemPrompt: string,
  userMessage: string,
  model: string,
  temperature: number,
  maxOutputTokens: number
): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama request failed: HTTP ${response.status} ${body.slice(0, 200)}`);
    }

    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    throw new Error(`Ollama is not running. Start it with ollama serve or switch provider. ${error.message || ''}`.trim());
  }
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string,
  temperature: number,
  maxOutputTokens: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature,
      max_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic request failed: HTTP ${response.status} ${body.slice(0, 200)}`);
  }

  const json = await response.json() as { content?: Array<{ type: string; text?: string }> };
  return json.content?.map((part) => part.text || '').join('\n').trim() || '';
}

export async function generateWithModelRouter(request: RoutedModelRequest): Promise<RoutedModelResponse> {
  const route = resolveRoute(request.agentKey, request.userApiKey);
  const temperature = request.temperature ?? 0.55;
  const maxOutputTokens = request.maxOutputTokens ?? 6000;
  const promptTokensEstimate = estimateTokens(`${request.systemPrompt}\n${request.userMessage}`);
  let text = '';

  if (route.provider === 'mock') {
    text = generateMockAgentOutput(request.systemPrompt, request.userMessage);
  } else if (route.provider === 'gemini') {
    text = await callGemini(
      request.systemPrompt,
      request.userMessage,
      getProviderKey('gemini', request.userApiKey) as string,
      route.model,
      temperature,
      maxOutputTokens
    );
  } else if (route.provider === 'openai') {
    text = await callOpenAI(
      request.systemPrompt,
      request.userMessage,
      getProviderKey('openai') as string,
      route.model,
      temperature,
      maxOutputTokens
    );
  } else if (route.provider === 'groq') {
    text = await callOpenAI(
      request.systemPrompt,
      request.userMessage,
      getProviderKey('groq') as string,
      route.model,
      temperature,
      maxOutputTokens,
      'https://api.groq.com/openai/v1'
    );
  } else if (route.provider === 'ollama') {
    text = await callOllama(
      request.systemPrompt,
      request.userMessage,
      route.model,
      temperature,
      maxOutputTokens
    );
  } else {
    text = await callAnthropic(
      request.systemPrompt,
      request.userMessage,
      getProviderKey('anthropic') as string,
      route.model,
      temperature,
      maxOutputTokens
    );
  }

  const completionTokensEstimate = estimateTokens(text);
  return {
    text,
    ...route,
    promptTokensEstimate,
    completionTokensEstimate,
    totalTokensEstimate: promptTokensEstimate + completionTokensEstimate,
    costEstimateUsd: null,
  };
}

export function getResolvedAgentRoute(agentKey: AgentKey, userApiKey?: string | null) {
  return resolveRoute(agentKey, userApiKey);
}
