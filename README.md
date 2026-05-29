# PDF Notes Converter

A functional Next.js app that turns uploaded text-based PDFs into structured study notes. The app extracts real PDF text first, then generates notes with Gemini when configured or deterministic mock mode when no Gemini key is available.

## Features

- Upload a PDF up to 10MB
- Validate missing files, non-PDF uploads, empty files, oversized files, and unreadable scanned PDFs
- Extract actual PDF text with `pdf-parse`
- Generate structured notes from extracted content
- Use Gemini through a server-only API key when available
- Fall back to mock mode that still analyzes the extracted PDF text
- Show provider badge, word count, page estimate, source preview, and processing status
- Copy full formatted notes to the clipboard
- Download notes as Markdown
- Responsive student productivity UI

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- `pdf-parse` for server-side PDF text extraction
- `@google/generative-ai` for Gemini notes generation
- Vitest for helper tests

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy the example file:

```bash
cd frontend
cp .env.example .env.local
```

Set:

```bash
GEMINI_API_KEY=your_key_here
AI_PROVIDER=gemini
```

`GEMINI_API_KEY` is only read in the server API route. It is not exposed to the frontend.

## Mock Mode

If `GEMINI_API_KEY` is missing, the app uses mock mode. Mock mode does not use the file name as the source of truth and does not return a generic template. It analyzes extracted PDF text to detect title lines, headings, repeated keywords, important sections, summary points, review questions, and revision actions.

## How PDF Extraction Works

The API route `frontend/app/api/generate-notes/route.ts` accepts multipart `FormData`, validates the uploaded file, reads the PDF buffer, extracts text using `pdf-parse`, cleans the text, and rejects PDFs with less than 100 readable characters.

If text extraction reads too little content, the API returns:

```text
This PDF may be scanned or image-based. Text extraction could not read enough content. OCR support can be added in a future version.
```

## API Output

The notes API returns:

```json
{
  "documentTitle": "...",
  "provider": "gemini",
  "summary": "...",
  "keyPoints": ["..."],
  "importantSections": ["..."],
  "definitions": ["..."],
  "examQuestions": ["..."],
  "revisionActions": ["..."],
  "sourcePreview": "...",
  "wordCount": 1000,
  "pageEstimate": 3
}
```

`provider` can be `gemini` or `mock`.

## Testing

Run automated helper tests:

```bash
cd frontend
npm run test
```

Run lint/build validation:

```bash
cd frontend
npm run lint
npm run build
```

## Manual Test Checklist

1. Valid text PDF: upload `bmi_calculator.pdf`. Expected notes mention BMI calculator, compiled website report, website workflow, requirements, pages, UI structure, tech stack, frontend plan, backend/API plan, deployment steps, and next steps. Output must not be generic.
2. No file selected: generate button is disabled or a clear no-file error appears.
3. Non-PDF upload: app shows `Only PDF files are accepted.`
4. Large PDF over 10MB: app shows `File is too large. Please upload a PDF under 10MB.`
5. Empty or scanned PDF: app explains OCR is not supported yet.
6. Gemini key missing: mock mode runs from extracted text and still reflects PDF content.
7. Gemini API failure: app falls back to mock mode and does not crash.
8. Mobile viewport: upload, status, notes, copy, and download remain usable.
9. Copy notes: copied Markdown includes all note sections.
10. Download Markdown: file name follows `notes-{original-pdf-name}.md`.

## Limitations

- Scanned or image-only PDFs need OCR support.
- PDF files are limited to 10MB.
- Very long PDFs are truncated before Gemini prompting to keep requests manageable.
- Page estimate is based on word count, not physical page metadata.

## Future Roadmap

- OCR support for scanned PDFs
- Multi-PDF upload
- Topic-wise notes
- Flashcard generation
- Quiz generation
- Export notes to PDF
- Save notes history
- User login
- Cloud storage
- Gemini multimodal PDF processing if supported later
- Better citations from source text
