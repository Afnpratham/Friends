import { GoogleGenerativeAI } from '@google/generative-ai';
import type { NotesResult } from '@/types/notes';

type GeminiInput = {
  text: string;
  fileName: string;
  wordCount: number;
  pageEstimate: number;
};

type GeminiNotes = Omit<NotesResult, 'provider' | 'sourcePreview' | 'wordCount' | 'pageEstimate'>;

function extractJson(raw: string): GeminiNotes {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemini did not return a JSON object.');
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as GeminiNotes;
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 10);
}

function normalizeGeminiNotes(parsed: GeminiNotes, fallbackTitle: string): GeminiNotes {
  return {
    documentTitle: String(parsed.documentTitle || fallbackTitle).trim(),
    summary: String(parsed.summary || '').trim(),
    keyPoints: normalizeArray(parsed.keyPoints),
    importantSections: normalizeArray(parsed.importantSections),
    definitions: normalizeArray(parsed.definitions),
    examQuestions: normalizeArray(parsed.examQuestions),
    revisionActions: normalizeArray(parsed.revisionActions),
  };
}

function looksGeneric(result: GeminiNotes, text: string): boolean {
  const output = `${result.documentTitle} ${result.summary} ${result.keyPoints.join(' ')}`.toLowerCase();
  const sourceWords = new Set((text.toLowerCase().match(/\b[a-z][a-z0-9/+.-]{3,}\b/g) || []).slice(0, 500));
  const genericPhrases = ['mock ' + 'converter', 'uploaded pdf into structured notes', 'provided document discusses'];
  const overlap = output
    .match(/\b[a-z][a-z0-9/+.-]{3,}\b/g)
    ?.filter((word) => sourceWords.has(word)).length || 0;

  return genericPhrases.some((phrase) => output.includes(phrase)) || overlap < 4 || result.summary.length < 50;
}

export async function generateGeminiNotes({ text, fileName, wordCount, pageEstimate }: GeminiInput): Promise<NotesResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a study-notes generator. Generate notes only from the provided extracted PDF text. Do not invent unrelated information. If content is limited, say so clearly. Return JSON only.

Required JSON keys:
documentTitle: string
summary: string
keyPoints: string[]
importantSections: string[]
definitions: string[]
examQuestions: string[]
revisionActions: string[]

File name: ${fileName}
Extracted word count: ${wordCount}
Estimated pages: ${pageEstimate}

Extracted PDF text:
${text.slice(0, 28000)}`;

  const response = await model.generateContent(prompt);
  const raw = response.response.text();
  const parsed = normalizeGeminiNotes(extractJson(raw), fileName.replace(/\.pdf$/i, ''));

  if (looksGeneric(parsed, text)) {
    throw new Error('Gemini output did not reflect the extracted PDF topic.');
  }

  return {
    ...parsed,
    provider: 'gemini',
    sourcePreview: text.slice(0, 1200),
    wordCount,
    pageEstimate,
  };
}
