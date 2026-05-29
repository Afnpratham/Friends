import { generateAgentOutput } from './geminiService';
import { ClarificationQA, PromptEnhancement, WorkflowType } from '../types';
import { getDomainRequirements, selectProjectTemplate } from './projectTemplateService';

interface EnhanceInput {
  title?: string;
  rawPrompt: string;
  workflowType: WorkflowType | string;
  clarifications?: ClarificationQA[];
  userApiKey?: string | null;
}

interface EnhanceResult {
  enhancement: PromptEnhancement;
  needsClarification: boolean;
  clarifyingQuestions: string[];
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferTitle(title: string | undefined, rawPrompt: string): string {
  if (title?.trim()) return title.trim();
  const cleaned = rawPrompt
    .replace(/^(make|build|create|generate)\s+(an?\s+)?/i, '')
    .replace(/[.?!]+$/g, '')
    .trim();
  return titleCase(cleaned || 'Generated Project');
}

function normalizeWorkflowType(workflowType: WorkflowType | string): WorkflowType {
  const normalized = workflowType.toLowerCase();
  const aliases: Record<string, WorkflowType> = {
    website: 'website',
    website_builder: 'website',
    app_builder: 'website',
    startup: 'startup',
    startup_builder: 'startup',
    student: 'student',
    student_project: 'student',
    student_project_builder: 'student',
    custom: 'custom',
    custom_agents: 'custom',
    custom_workflow: 'custom',
  };

  return aliases[normalized] || 'custom';
}

function detectProjectType(rawPrompt: string, workflowType: WorkflowType | string): string {
  const text = rawPrompt.toLowerCase();
  const normalizedWorkflow = normalizeWorkflowType(workflowType);
  if (normalizedWorkflow === 'startup') return 'startup plan with MVP scaffold';
  if (normalizedWorkflow === 'student') return 'student project with runnable scaffold';
  if (text.includes('portal')) return 'functional web app/dashboard';
  if (text.includes('dashboard')) return 'dashboard';
  if (text.includes('ai') || text.includes('gemini') || text.includes('openai')) return 'AI app';
  if (/(converter|tracker|tool|app|management system|calculator|generator|checker)/i.test(text)) return 'functional web app';
  if (text.includes('landing')) return 'landing page';
  if (normalizedWorkflow === 'website') return 'functional website';
  return 'custom workflow';
}

function isVague(rawPrompt: string): boolean {
  const words = rawPrompt.trim().split(/\s+/).filter(Boolean);
  return words.length < 5 || /^make an? app for students\.?$/i.test(rawPrompt.trim());
}

function defaultClarifyingQuestions(rawPrompt: string): string[] {
  const vagueStudent = /students/i.test(rawPrompt);
  return [
    vagueStudent ? 'What student problem should the app solve?' : 'What exact problem should this app solve?',
    'Should it be a web app, dashboard, landing page, or full-stack app?',
    'Should it include login or user accounts?',
    'Do you want AI features, and should mock mode work without an API key?',
    'Should the app store uploaded files, generated outputs, or user history?',
  ];
}

function buildFinalPrompt(enhancement: Omit<PromptEnhancement, 'finalEnhancedPrompt'>): string {
  return `Build a complete runnable software project with the following requirements.

Project title: ${enhancement.projectTitle}
Project type: ${enhancement.projectType}
Target users: ${enhancement.targetUsers.join(', ')}
Main goal: ${enhancement.mainGoal}

Required features:
${enhancement.requiredFeatures.map((item) => `- ${item}`).join('\n')}

Optional advanced features:
${enhancement.optionalFeatures.map((item) => `- ${item}`).join('\n')}

Frontend requirements:
${enhancement.frontendRequirements.map((item) => `- ${item}`).join('\n')}

Backend/API requirements:
${enhancement.backendRequirements.map((item) => `- ${item}`).join('\n')}

Database/storage needs:
${enhancement.databaseRequirements.map((item) => `- ${item}`).join('\n')}

AI/API needs:
${enhancement.aiRequirements.map((item) => `- ${item}`).join('\n')}

Mock mode behavior:
${enhancement.mockModeBehavior.map((item) => `- ${item}`).join('\n')}

Domain-specific requirements:
${(enhancement.domainSpecificRequirements || []).map((item) => `- ${item}`).join('\n')}

Selected project template: ${enhancement.selectedTemplate || 'generic_functional_app'}

Required calculations:
${(enhancement.requiredCalculations || []).map((item) => `- ${item}`).join('\n')}

Required data:
${(enhancement.requiredData || []).map((item) => `- ${item}`).join('\n')}

User flow:
${enhancement.userFlow.map((item) => `- ${item}`).join('\n')}

Required pages/components:
${enhancement.requiredComponents.map((item) => `- ${item}`).join('\n')}

Required files:
${enhancement.requiredFiles.map((item) => `- ${item}`).join('\n')}

Validation checklist:
${enhancement.validationChecklist.map((item) => `- ${item}`).join('\n')}

Forbidden mistakes:
${enhancement.forbiddenMistakes.map((item) => `- ${item}`).join('\n')}

Expected final output format:
- Generate a ZIP-ready source-code file map.
- Include runnable Next.js source code, supporting docs, package.json, setup instructions, and mock behavior.
- Do not output only documentation.`;
}

function mockEnhancement(input: EnhanceInput): EnhanceResult {
  const title = inferTitle(input.title, input.rawPrompt);
  const projectType = detectProjectType(input.rawPrompt, input.workflowType);
  const text = input.rawPrompt.toLowerCase();
  const isPdfNotes = text.includes('pdf') && (text.includes('notes') || text.includes('note'));
  const selectedTemplate = selectProjectTemplate(input.rawPrompt, input.workflowType);
  const isAttendancePortal = selectedTemplate === 'student_attendance_portal';
  const isFunctional = /app|tool|converter|tracker|dashboard|portal|management system|calculator|generator|checker/i.test(input.rawPrompt);
  const domainSpecificRequirements = getDomainRequirements(selectedTemplate);

  const base = {
    projectTitle: title,
    projectType: isAttendancePortal ? 'functional web app/dashboard' : projectType,
    targetUsers: isAttendancePortal
      ? ['Students']
      : isPdfNotes
        ? ['Students', 'Researchers', 'Professionals reviewing PDFs']
        : ['Primary app users', 'Project owners'],
    mainGoal: isAttendancePortal
      ? 'Build a functional education/student portal where students can check attendance, understand risk status, and see classes needed to reach 75%.'
      : isPdfNotes
      ? 'Build a functional PDF-to-notes web app that accepts PDF uploads and produces clear notes.'
      : `Build a complete ${projectType} for: ${input.rawPrompt}`,
    requiredFeatures: isAttendancePortal
      ? [
          'Student profile card with name, roll number, program, semester, and advisor',
          'Overall attendance summary with total, attended, and missed classes',
          'Subject-wise attendance dashboard and table',
          'Attendance percentage calculation for every subject',
          'Safe/warning/critical status badges based on attendance thresholds',
          'Classes-needed calculator to reach 75% attendance',
          'Search/filter by subject name, code, or instructor',
          'Loading, empty, and error states',
        ]
      : isPdfNotes
      ? [
          'PDF upload with file validation',
          'Extract or simulate PDF text processing',
          'Generate structured notes from the uploaded PDF',
          'Show notes output in the UI',
          'Copy notes to clipboard',
          'Download notes as Markdown or text',
          'Loading and error states',
        ]
      : [
          'Functional user-facing interface',
          'Real source code, not only a landing page unless explicitly requested',
          'Responsive layout',
          'Clear empty, loading, and error states',
        ],
    optionalFeatures: isAttendancePortal
      ? ['Student login in a future version', 'Export attendance report', 'Admin upload of attendance records']
      : isPdfNotes
      ? ['Notes summary levels', 'Bullet/outline mode', 'Saved note history', 'Drag-and-drop upload']
      : ['Authentication', 'Saved history', 'Admin dashboard', 'Analytics'],
    frontendRequirements: [
      'Next.js App Router project',
      'Tailwind CSS styling',
      'Accessible forms and buttons',
      'Responsive mobile-first UI',
    ],
    backendRequirements: isAttendancePortal
      ? ['No backend required for version 1 unless persistence is requested', 'Use mock data locally for the MVP']
      : isPdfNotes
      ? ['API route for notes generation', 'Server-side validation for uploaded files', 'Return mock notes when AI provider is mock']
      : ['Add API routes only when the feature requires server logic'],
    databaseRequirements: isAttendancePortal
      ? ['No database required for version 1', 'Use typed mock student and subject data']
      : isPdfNotes
      ? ['No database required for MVP unless saving note history', 'Use local state for mock MVP']
      : ['Use storage only if persistence is requested'],
    aiRequirements: isPdfNotes
      ? ['Use Gemini/OpenAI-compatible abstraction when API key exists', 'Summarize extracted PDF text into notes']
      : ['Use AI only if required by the project prompt'],
    mockModeBehavior: isAttendancePortal
      ? ['Do not call external APIs in mock mode', 'Use realistic mock student profile and subject attendance data']
      : isPdfNotes
      ? ['Do not call external AI APIs in mock mode', 'Generate realistic notes from PDF filename and sample extracted text']
      : ['Do not call external AI APIs in mock mode', 'Return deterministic realistic sample data'],
    domainSpecificRequirements,
    selectedTemplate,
    requiredCalculations: isAttendancePortal
      ? ['Attendance percentage = attended classes / total classes * 100', 'Classes needed to reach 75% by attending consecutive future classes']
      : [],
    requiredData: isAttendancePortal
      ? ['Student profile', 'Subjects', 'Total classes', 'Attended classes', 'Missed classes']
      : [],
    userFlow: isAttendancePortal
      ? [
          'Student opens the attendance portal',
          'Student sees profile and overall attendance summary',
          'Student searches or filters subjects',
          'Student reviews subject-wise percentages and status badges',
          'Student checks how many classes are needed to reach 75%',
        ]
      : isPdfNotes
      ? [
          'User opens the app',
          'User uploads a PDF',
          'User clicks Generate Notes',
          'App validates the file and shows progress',
          'App displays structured notes',
          'User copies or downloads the notes',
        ]
      : ['User opens the app', 'User completes the main action', 'App shows useful result and next action'],
    requiredComponents: isAttendancePortal
      ? [
          'Navbar',
          'StudentDashboard',
          'AttendanceSummaryCards',
          'AttendanceTable',
          'SubjectAttendanceCard',
          'AttendanceStatusBadge',
          'AttendanceCalculator',
          'EmptyState',
          'Footer',
        ]
      : isPdfNotes
      ? ['Navbar', 'PdfUpload', 'GenerateNotesButton', 'NotesOutput', 'DownloadActions', 'Footer']
      : ['Navbar', 'Hero or main app shell', 'Primary workflow component', 'Result/output component', 'Footer'],
    requiredFiles: isAttendancePortal
      ? [
          'package.json',
          'next.config.js',
          'tsconfig.json',
          'tailwind.config.ts',
          'postcss.config.js',
          'app/page.tsx',
          'app/layout.tsx',
          'app/globals.css',
          'components/Navbar.tsx',
          'components/StudentDashboard.tsx',
          'components/AttendanceSummaryCards.tsx',
          'components/AttendanceTable.tsx',
          'components/SubjectAttendanceCard.tsx',
          'components/AttendanceStatusBadge.tsx',
          'components/AttendanceCalculator.tsx',
          'components/EmptyState.tsx',
          'components/Footer.tsx',
          'lib/mockData.ts',
          'lib/attendance.ts',
          'types/attendance.ts',
          'README.md',
        ]
      : [
          'package.json',
          'next.config.js',
          'tsconfig.json',
          'tailwind.config.ts',
          'postcss.config.js',
          'app/page.tsx',
          'app/layout.tsx',
          'app/globals.css',
          'components/*',
          'README.md',
          '.env.example if API keys are needed',
        ],
    validationChecklist: [
      'npm install succeeds',
      'npm run dev starts the app',
      'Main user flow works in mock mode',
      'No docs-only ZIP is exported',
      'README includes setup and mock mode instructions',
      ...(isAttendancePortal
        ? [
            'components/StudentDashboard.tsx exists',
            'components/AttendanceTable.tsx exists',
            'lib/attendance.ts exists',
            'lib/mockData.ts exists',
            'types/attendance.ts exists',
            'No fitness, trainer, PulseFit, pricing, or generic landing page content exists',
          ]
        : []),
    ],
    forbiddenMistakes: isAttendancePortal
      ? [
          'Do not generate a fitness app',
          'Do not include a trainer section',
          'Do not include a pricing section unless paid plans are requested',
          'Do not include testimonials',
          'Do not generate a generic SaaS landing page',
          'Do not output only documentation',
          'Do not omit attendance logic',
          'Do not omit mock data',
          'Do not omit the dashboard',
        ]
      : isPdfNotes
      ? [
          'Do not generate a fitness app',
          'Do not generate only a landing page',
          'Do not output only documentation',
          'Do not omit PDF upload',
          'Do not omit notes output',
          'Do not omit mock mode or AI fallback',
          'Do not omit README setup instructions',
        ]
      : [
          isFunctional ? 'Do not generate only a landing page for an app/tool request' : 'Do not ignore the requested project type',
          'Do not output only documentation',
          'Do not omit runnable source files',
          'Do not omit setup instructions',
        ],
  };
  const enhancement: PromptEnhancement = {
    ...base,
    finalEnhancedPrompt: buildFinalPrompt(base),
  };

  return {
    enhancement,
    needsClarification: isVague(input.rawPrompt),
    clarifyingQuestions: isVague(input.rawPrompt) ? defaultClarifyingQuestions(input.rawPrompt) : [],
  };
}

function coerceEnhancement(value: any, fallback: EnhanceResult): EnhanceResult {
  const source = value?.enhancement || value;
  const enhancement: PromptEnhancement = {
    ...fallback.enhancement,
    ...source,
    finalEnhancedPrompt: source?.finalEnhancedPrompt || fallback.enhancement.finalEnhancedPrompt,
  };

  return {
    enhancement,
    needsClarification: Boolean(value?.needsClarification ?? fallback.needsClarification),
    clarifyingQuestions: Array.isArray(value?.clarifyingQuestions)
      ? value.clarifyingQuestions
      : fallback.clarifyingQuestions,
  };
}

export async function enhanceUserPrompt(input: EnhanceInput): Promise<EnhanceResult> {
  const fallback = mockEnhancement(input);

  if ((process.env.AI_PROVIDER || '').toLowerCase() === 'mock') {
    return fallback;
  }

  const clarificationsText = input.clarifications?.length
    ? input.clarifications.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')
    : 'No clarifying answers yet.';

  const systemPrompt = `You are the Prompt Enhancer / Requirement Refiner Agent for FRIENDS.
Return only valid JSON with:
{
  "enhancement": {
    "projectTitle": "...",
    "projectType": "...",
    "targetUsers": ["..."],
    "mainGoal": "...",
    "requiredFeatures": ["..."],
    "optionalFeatures": ["..."],
    "frontendRequirements": ["..."],
    "backendRequirements": ["..."],
    "databaseRequirements": ["..."],
    "aiRequirements": ["..."],
    "mockModeBehavior": ["..."],
    "userFlow": ["..."],
    "requiredComponents": ["..."],
    "requiredFiles": ["..."],
    "validationChecklist": ["..."],
    "forbiddenMistakes": ["..."],
    "domainSpecificRequirements": ["..."],
    "selectedTemplate": "student_attendance_portal | expense_tracker | pdf_to_notes_converter | habit_tracker | task_manager | startup_landing_page | portfolio_website | admin_dashboard | generic_functional_app",
    "requiredCalculations": ["..."],
    "requiredData": ["..."],
    "finalEnhancedPrompt": "..."
  },
  "needsClarification": false,
  "clarifyingQuestions": []
}

Important rules:
- If the user asks for an app/tool/converter/tracker/dashboard, do not classify it as only a landing page.
- If the user asks for a portal, app, dashboard, tracker, converter, management system, calculator, generator, or checker, generate functional app/dashboard requirements, not landing-page requirements.
- Extract domain-specific entities, data, calculations, and UI components from the raw user idea.
- For a student attendance portal, select student_attendance_portal and include attendance percentage, classes needed to reach 75%, mock student data, subject-wise table, status badges, and dashboard requirements.
- The finalEnhancedPrompt is the exact prompt for the code generator.
- The finalEnhancedPrompt must include a "Domain-specific requirements:" section.
- Include forbidden mistakes that prevent wrong themes, docs-only output, and missing core features.`;

  const userMessage = `Workflow: ${input.workflowType}
User title: ${input.title || 'Not provided'}
Raw project idea: ${input.rawPrompt}

Clarifying answers:
${clarificationsText}

Create the enhanced software requirement prompt.`;

  try {
    const output = await generateAgentOutput(systemPrompt, userMessage, input.userApiKey);
    const parsed = JSON.parse(output.replace(/^```json\s*/i, '').replace(/```$/g, '').trim());
    return coerceEnhancement(parsed, fallback);
  } catch {
    return fallback;
  }
}
