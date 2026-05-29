import type { NotesResult } from '@/types/notes';

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  const formatted = value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');

  return `${formatted} ${units[exponent]}`;
}

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function listToMarkdown(items: string[]): string {
  if (!items.length) {
    return '- Not identified from the extracted PDF text.';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

export function formatNotesAsMarkdown(result: NotesResult): string {
  const generatedAt = new Date().toLocaleString();

  return `# ${result.documentTitle}

Generated using: ${result.provider === 'gemini' ? 'Gemini' : 'Mock Mode'}
Generated at: ${generatedAt}
Word count: ${result.wordCount}
Page estimate: ${result.pageEstimate}

## Summary

${result.summary}

## Key Points

${listToMarkdown(result.keyPoints)}

## Important Sections

${listToMarkdown(result.importantSections)}

## Definitions / Terms

${listToMarkdown(result.definitions)}

## Possible Questions

${listToMarkdown(result.examQuestions)}

## Revision Actions

${listToMarkdown(result.revisionActions)}

## Source Preview

${result.sourcePreview}
`;
}
