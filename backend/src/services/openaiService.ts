/**
 * OpenAI Service
 * Wraps the OpenAI SDK to provide a clean interface for AI completions.
 * Supports user-provided API keys (falls back to platform key).
 */

import OpenAI from 'openai';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Creates an OpenAI client with the given API key.
 * Falls back to the platform key if not provided.
 */
function getClient(userApiKey?: string | null): OpenAI {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('No OpenAI API key available. Please add your key in Settings.');
  }
  return new OpenAI({ apiKey });
}

/**
 * Generates a chat completion for an agent.
 * @param systemPrompt - The agent's system prompt (role + task)
 * @param userMessage - The user's goal/description
 * @param userApiKey - Optional user-provided OpenAI key
 * @param model - The OpenAI model to use
 */
export async function generateAgentOutput(
  systemPrompt: string,
  userMessage: string,
  userApiKey?: string | null,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const client = getClient(userApiKey);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generates clarifying questions for a given project description.
 * @param workflowType - The type of workflow (website, startup, student, custom)
 * @param description - The user's project description
 * @param userApiKey - Optional user-provided OpenAI key
 */
export async function generateClarifyingQuestions(
  title: string,
  workflowType: string,
  description: string,
  userApiKey?: string | null
): Promise<string[]> {
  const client = getClient(userApiKey);

  const systemPrompt = `You are a smart project intake assistant for the FRIENDS AI platform.
Your job is to ask 4-5 targeted clarifying questions that will help our AI agents produce a better output.
Return ONLY a JSON array of question strings. No preamble, no explanation.
Example: ["What is your target audience?", "Do you need a backend?"]`;

  const userMessage = `Project title: ${title}
Workflow type: ${workflowType}
Project description: ${description}

Generate 4-5 specific clarifying questions that would help AI agents produce better output for this project.`;

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.6,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{"questions":[]}';

  try {
    // Handle both {"questions": [...]} and direct array formats
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    // Try to find any array in the response
    const values = Object.values(parsed);
    for (const v of values) {
      if (Array.isArray(v)) return v as string[];
    }
    return [];
  } catch {
    return [];
  }
}
