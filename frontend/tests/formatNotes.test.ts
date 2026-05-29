import { describe, expect, it } from 'vitest';
import { cleanExtractedText, formatFileSize, formatNotesAsMarkdown } from '../lib/formatNotes';
import type { NotesResult } from '../types/notes';

describe('format helpers', () => {
  it('formats file sizes for upload limits and previews', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
  });

  it('cleans extracted PDF text without removing real content', () => {
    const cleaned = cleanExtractedText('BMI   Calculator \n\n\n Requirements  :  pages');

    expect(cleaned).toContain('BMI Calculator');
    expect(cleaned).toContain('Requirements: pages');
    expect(cleaned).not.toContain('\n\n\n');
  });

  it('exports complete notes as Markdown', () => {
    const result: NotesResult = {
      documentTitle: 'BMI Calculator Website Report',
      provider: 'mock',
      summary: 'This document is a compiled website report for a BMI calculator project.',
      keyPoints: ['Requirements are listed.', 'Deployment steps are included.'],
      importantSections: ['Requirements', 'Tech stack'],
      definitions: ['BMI: body mass index.'],
      examQuestions: ['What requirements are included?'],
      revisionActions: ['Review the frontend and backend plan.'],
      sourcePreview: 'BMI calculator report source preview.',
      wordCount: 120,
      pageEstimate: 1,
    };

    const markdown = formatNotesAsMarkdown(result);

    expect(markdown).toContain('# BMI Calculator Website Report');
    expect(markdown).toContain('Generated using: Mock Mode');
    expect(markdown).toContain('## Possible Questions');
  });
});
