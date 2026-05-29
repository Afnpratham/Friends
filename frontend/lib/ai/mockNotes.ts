import type { NotesResult } from '@/types/notes';

type MockInput = {
  text: string;
  fileName: string;
  wordCount: number;
  pageEstimate: number;
};

const COMMON_WORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'because',
  'been',
  'but',
  'can',
  'for',
  'from',
  'has',
  'have',
  'into',
  'its',
  'may',
  'more',
  'not',
  'page',
  'pages',
  'pdf',
  'project',
  'that',
  'the',
  'their',
  'this',
  'with',
  'will',
  'your',
]);

const SECTION_HINTS = [
  'requirements',
  'pages',
  'ui structure',
  'tech stack',
  'frontend',
  'backend',
  'api',
  'deployment',
  'next steps',
  'workflow',
  'overview',
  'features',
  'testing',
  'code outline',
];

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function detectTitle(lines: string[], fileName: string): string {
  const candidates = lines
    .slice(0, 12)
    .filter((line) => line.length >= 4 && line.length <= 100)
    .filter((line) => !/^page\s+\d+/i.test(line));

  const reportLine = candidates.find((line) => /report|notes|overview|requirements|calculator|friends/i.test(line));
  return reportLine || titleCase(fileName.replace(/\.pdf$/i, ''));
}

function detectHeadings(lines: string[]): string[] {
  const headings = lines.filter((line) => {
    const words = line.split(/\s+/).length;
    const hasHint = SECTION_HINTS.some((hint) => line.toLowerCase().includes(hint));
    const looksLikeHeading = words <= 9 && !/[.!?]$/.test(line);
    return line.length <= 90 && (hasHint || looksLikeHeading);
  });

  return Array.from(new Set(headings)).slice(0, 10);
}

function sentenceCandidates(text: string): string[] {
  return text
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 220);
}

function repeatedKeywords(text: string): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/\b[a-z][a-z0-9/+.-]{2,}\b/g) || [];

  for (const word of words) {
    if (!COMMON_WORDS.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function sectionBasedPoints(headings: string[], sentences: string[], keywords: string[]): string[] {
  const points = headings
    .filter((heading) => SECTION_HINTS.some((hint) => heading.toLowerCase().includes(hint)))
    .map((heading) => `Covers ${heading.toLowerCase()} as a major document section.`);

  for (const sentence of sentences) {
    if (points.length >= 8) break;
    points.push(sentence);
  }

  if (points.length < 5) {
    for (const keyword of keywords.slice(0, 5)) {
      points.push(`Highlights ${keyword} as a recurring topic in the PDF.`);
    }
  }

  return Array.from(new Set(points)).slice(0, 8);
}

function detectDefinitions(lines: string[], keywords: string[]): string[] {
  const definitions = lines
    .filter((line) => /:|-|means|refers to|stands for/i.test(line))
    .filter((line) => line.length >= 20 && line.length <= 180)
    .slice(0, 6);

  if (definitions.length) {
    return definitions;
  }

  return keywords.slice(0, 5).map((keyword) => `${titleCase(keyword)}: recurring term identified from the extracted PDF text.`);
}

function makeSummary(title: string, headings: string[], keywords: string[], sentences: string[]): string {
  const lower = `${title} ${headings.join(' ')} ${keywords.join(' ')}`.toLowerCase();

  if (lower.includes('bmi') && lower.includes('calculator')) {
    const covered = [
      lower.includes('requirements') && 'requirements',
      lower.includes('pages') && 'pages',
      lower.includes('ui') && 'UI structure',
      lower.includes('tech') && 'tech stack',
      lower.includes('frontend') && 'frontend planning',
      (lower.includes('backend') || lower.includes('api')) && 'backend/API planning',
      lower.includes('deployment') && 'deployment steps',
      lower.includes('next steps') && 'next steps',
    ].filter(Boolean);

    return `This document is a compiled website report for a BMI calculator project. It outlines ${covered.length ? covered.join(', ') : 'the main website workflow and implementation plan'} based on the extracted PDF content.`;
  }

  const topic = keywords.slice(0, 4).map(titleCase).join(', ');
  const sectionText = headings.slice(0, 4).join(', ');
  const base = sentences[0] || `The PDF discusses ${topic || title}.`;

  return `${base} Main areas identified from the extracted text include ${sectionText || topic || title}.`;
}

export function generateMockNotes({ text, fileName, wordCount, pageEstimate }: MockInput): NotesResult {
  const lines = getLines(text);
  const title = detectTitle(lines, fileName);
  const headings = detectHeadings(lines);
  const sentences = sentenceCandidates(text);
  const keywords = repeatedKeywords(text);
  const keyPoints = sectionBasedPoints(headings, sentences, keywords);
  const importantSections = headings.length ? headings : keywords.slice(0, 6).map(titleCase);

  return {
    documentTitle: title,
    provider: 'mock',
    summary: makeSummary(title, headings, keywords, sentences),
    keyPoints,
    importantSections: importantSections.slice(0, 8),
    definitions: detectDefinitions(lines, keywords),
    examQuestions: importantSections.slice(0, 6).map((section) => `What does the document explain about ${section.toLowerCase()}?`),
    revisionActions: [
      `Review the main topic: ${title}.`,
      'Turn each important section into a short revision note.',
      'Compare requirements, implementation plan, and deployment steps where they appear in the PDF.',
      'Use the questions above to test recall after reading the source preview.',
    ],
    sourcePreview: text.slice(0, 1200),
    wordCount,
    pageEstimate,
  };
}
