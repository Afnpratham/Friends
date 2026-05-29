import { NextResponse } from 'next/server';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { cleanExtractedText } from '@/lib/formatNotes';
import { generateNotes } from '@/lib/ai/notesGenerator';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_EXTRACTED_CHARS = 100;

PDFParse.setWorker(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'));

function errorResponse(message: string, status = 400, details?: string) {
  return NextResponse.json({ error: message, details }, { status });
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return cleanExtractedText(result.text || '');
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return errorResponse('No PDF file was uploaded. Choose a PDF and try again.');
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return errorResponse('Only PDF files are accepted.');
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File is too large. Please upload a PDF under 10MB.');
    }

    if (file.size === 0) {
      return errorResponse('The uploaded PDF is empty.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';
    try {
      extractedText = await extractPdfText(buffer);
    } catch (error) {
      return errorResponse(
        'PDF text extraction failed. Please try another text-based PDF.',
        422,
        error instanceof Error ? error.message : 'Unknown extraction error',
      );
    }

    if (extractedText.length < MIN_EXTRACTED_CHARS) {
      return errorResponse(
        'This PDF may be scanned or image-based. Text extraction could not read enough content. OCR support can be added in a future version.',
        422,
      );
    }

    const words = extractedText.match(/\S+/g) || [];
    const result = await generateNotes({
      text: extractedText,
      fileName: file.name,
      wordCount: words.length,
      pageEstimate: Math.max(1, Math.ceil(words.length / 450)),
    });

    if (!result.summary || (!result.keyPoints.length && !result.importantSections.length)) {
      return errorResponse('Notes generation returned an empty result. Please try again.', 502);
    }

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(
      'Something went wrong while processing the PDF.',
      500,
      error instanceof Error ? error.message : 'Unknown server error',
    );
  }
}
