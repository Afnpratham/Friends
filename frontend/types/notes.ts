export type NotesProvider = 'gemini' | 'mock';

export type ProcessingState =
  | 'idle'
  | 'selected'
  | 'uploading'
  | 'extracting'
  | 'generating'
  | 'ready'
  | 'error';

export type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
};

export type NotesResult = {
  documentTitle: string;
  provider: NotesProvider;
  summary: string;
  keyPoints: string[];
  importantSections: string[];
  definitions: string[];
  examQuestions: string[];
  revisionActions: string[];
  sourcePreview: string;
  wordCount: number;
  pageEstimate: number;
};

export type GenerateNotesResponse =
  | NotesResult
  | {
      error: string;
      details?: string;
    };
