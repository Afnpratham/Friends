/**
 * Gemini AI Service
 * Wraps the Google Generative AI SDK to provide a clean interface for
 * all AI completions in the FRIENDS platform.
 * Supports user-provided Gemini API keys (falls back to platform key).
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { generateMockAgentOutput, generateMockClarifyingQuestions } from './mockAiService';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function shouldUseMockAi(userApiKey?: string | null): boolean {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  if (provider === 'mock') return true;
  return !userApiKey && !process.env.GEMINI_API_KEY;
}

// Safety settings — allow technical/business content without over-blocking
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Returns an initialised GoogleGenerativeAI client.
 * Uses the user-provided key first, then falls back to the platform key.
 */
function getClient(userApiKey?: string | null): GoogleGenerativeAI {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No Gemini API key available. Please add your key in Settings → API Key.'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Generates a response for an AI agent.
 *
 * @param systemPrompt  The agent's system prompt (role + context + task)
 * @param userMessage   The user's goal / project description
 * @param userApiKey    Optional user-provided Gemini API key
 * @param model         The Gemini model to use (default: gemini-2.0-flash)
 */
export async function generateAgentOutput(
  systemPrompt: string,
  userMessage: string,
  userApiKey?: string | null,
  model: string = DEFAULT_MODEL
): Promise<string> {
  if (shouldUseMockAi(userApiKey)) {
    return generateMockAgentOutput(systemPrompt, userMessage);
  }

  const genAI = getClient(userApiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.9,
    },
  });

  const result = await geminiModel.generateContent(userMessage);
  const response = result.response;
  return response.text();
}

/**
 * Generates 4-5 targeted clarifying questions for a project description.
 *
 * @param title         The user's project title
 * @param workflowType  Website | startup | student | custom
 * @param description   The user's raw project description
 * @param userApiKey    Optional user Gemini key
 */
export async function generateClarifyingQuestions(
  title: string,
  workflowType: string,
  description: string,
  userApiKey?: string | null
): Promise<string[]> {
  if (shouldUseMockAi(userApiKey)) {
    return generateMockClarifyingQuestions(title, workflowType, description);
  }

  const genAI = getClient(userApiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: `You are a smart project intake assistant for the FRIENDS AI platform.
Your job is to ask 4-5 targeted clarifying questions that will help our AI agents produce better output.
Return ONLY a valid JSON object in this exact format: {"questions": ["question 1", "question 2", ...]}
No preamble, no explanation, no markdown fences — just raw JSON.`,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Project title: ${title}
Workflow type: ${workflowType}
Project description: ${description}

Generate 4-5 specific clarifying questions that will help AI agents produce better output for this exact project. Use all details above.`;

  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    // Fallback: try any array in the object
    const firstArray = Object.values(parsed).find(Array.isArray);
    return (firstArray as string[]) || [];
  } catch {
    // If JSON parse fails, extract questions heuristically
    const lines = text
      .split('\n')
      .map((l: string) => l.replace(/^[\d.*[\]"-]+\s*/, '').trim())
      .filter((l: string) => l.length > 10 && l.includes('?'));
    return lines.slice(0, 5);
  }
}
