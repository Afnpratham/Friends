import type { NotesResult } from '@/types/notes';
import { generateGeminiNotes } from './gemini';
import { generateMockNotes } from './mockNotes';

type NotesGeneratorInput = {
  text: string;
  fileName: string;
  wordCount: number;
  pageEstimate: number;
};

export async function generateNotes(input: NotesGeneratorInput): Promise<NotesResult> {
  const wantsGemini = process.env.AI_PROVIDER === 'gemini' || Boolean(process.env.GEMINI_API_KEY);

  if (wantsGemini && process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiNotes(input);
    } catch (error) {
      console.error('Gemini notes generation failed. Falling back to mock mode.', error);
    }
  }

  return generateMockNotes(input);
}
