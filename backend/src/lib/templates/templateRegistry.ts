import { ProjectTemplateKey } from '../../types';

export interface TemplateDefinition {
  templateId: ProjectTemplateKey;
  whenToUse: string[];
  requiredFeatures: string[];
  optionalFeatures: string[];
  requiredFiles: string[];
  requiredComponents: string[];
  requiredLogic: string[];
  forbiddenPatterns: string[];
  validationRules: string[];
  uiUxRules: string[];
  mockDataRules: string[];
}

const baseForbidden = ['Sample workflow item', 'Add an item', 'pricing', 'testimonials'];

export const templateRegistry: Record<ProjectTemplateKey, TemplateDefinition> = {
  ambulance_tracker: {
    templateId: 'ambulance_tracker',
    whenToUse: ['ambulance', 'tracker', 'track', 'live location', 'nearby', 'map', 'route', 'ETA'],
    requiredFeatures: ['current location status', 'nearby ambulances', 'ambulance selection', 'request ambulance', 'simulated live updates', 'emergency safety note'],
    optionalFeatures: ['mock map grid', 'driver contact panel'],
    requiredFiles: ['app/page.tsx', 'components/AmbulanceTracker.tsx', 'components/MapPanel.tsx', 'components/AmbulanceList.tsx', 'components/AmbulanceCard.tsx', 'components/AmbulanceDetails.tsx', 'components/LocationPermissionCard.tsx', 'components/EmergencyActions.tsx', 'components/StatusBadge.tsx', 'lib/location.ts', 'lib/mockAmbulances.ts', 'types/ambulance.ts'],
    requiredComponents: ['AmbulanceTracker', 'MapPanel', 'AmbulanceList', 'AmbulanceCard', 'AmbulanceDetails', 'LocationPermissionCard', 'EmergencyActions', 'StatusBadge'],
    requiredLogic: ['calculateDistanceKm', 'calculateEtaMinutes', 'sortAmbulancesByDistance', 'selected ambulance state', 'loading/error/empty states', 'simulated updates'],
    forbiddenPatterns: [...baseForbidden, 'todo list', 'startup landing page only'],
    validationRules: ['must show distance and ETA', 'must include request button', 'must work without a paid map API'],
    uiUxRules: ['dashboard app first screen', 'map-like panel', 'emergency action emphasis'],
    mockDataRules: ['use realistic ambulance IDs, hospitals, drivers, statuses, coordinates'],
  },
  pdf_to_notes_converter: {
    templateId: 'pdf_to_notes_converter',
    whenToUse: ['PDF', 'notes', 'upload', 'document', 'summarize'],
    requiredFeatures: ['PDF upload', 'PDF validation', 'real text extraction', 'notes from extracted text', 'Gemini if available', 'mock mode from extracted text', 'copy', 'Markdown download', 'scanned PDF error'],
    optionalFeatures: ['source preview', 'provider badge'],
    requiredFiles: ['app/api/generate-notes/route.ts', 'components/PDFUploader.tsx', 'components/NotesOutput.tsx', 'components/ProcessingStatus.tsx', 'components/FilePreviewCard.tsx', 'lib/pdf.ts', 'lib/notes.ts', 'lib/formatNotes.ts', 'types/notes.ts'],
    requiredComponents: ['PDFUploader', 'NotesOutput', 'ProcessingStatus', 'FilePreviewCard'],
    requiredLogic: ['pdf-parse extraction', 'cleanExtractedText', 'Gemini fallback', 'copy/download markdown'],
    forbiddenPatterns: [...baseForbidden, 'notes based only on filename', 'generic mock converter text', 'fake extraction'],
    validationRules: ['must include pdf-parse or pdfjs-dist dependency', 'must reject scanned PDFs instead of faking notes'],
    uiUxRules: ['student productivity workspace', 'clear upload area', 'notes cards'],
    mockDataRules: ['mock mode must analyze extracted PDF text'],
  },
  student_attendance_portal: {
    templateId: 'student_attendance_portal',
    whenToUse: ['attendance', 'student portal'],
    requiredFeatures: ['student profile', 'subject-wise attendance', 'overall summary', 'percentage', 'status badges', 'classes needed for 75%', 'search/filter', 'mock data'],
    optionalFeatures: ['refresh simulation'],
    requiredFiles: ['components/StudentDashboard.tsx', 'components/AttendanceSummaryCards.tsx', 'components/AttendanceTable.tsx', 'components/SubjectAttendanceCard.tsx', 'components/AttendanceStatusBadge.tsx', 'components/AttendanceCalculator.tsx', 'lib/attendance.ts', 'lib/mockData.ts', 'types/attendance.ts'],
    requiredComponents: ['StudentDashboard', 'AttendanceSummaryCards', 'AttendanceTable', 'SubjectAttendanceCard', 'AttendanceStatusBadge', 'AttendanceCalculator'],
    requiredLogic: ['calculateAttendancePercentage', 'calculateClassesNeededFor75', 'getAttendanceStatus'],
    forbiddenPatterns: [...baseForbidden, 'fitness content', 'generic todo list', 'landing page only'],
    validationRules: ['must calculate 75% recovery classes', 'must show safe/warning/critical'],
    uiUxRules: ['academic dashboard', 'tables/cards/badges'],
    mockDataRules: ['use subject-wise attendance records'],
  },
  expense_tracker: {
    templateId: 'expense_tracker',
    whenToUse: ['expense tracker', 'transaction', 'budget'],
    requiredFeatures: ['add transaction', 'income/expense summary', 'filters', 'transaction list', 'mock persistence'],
    optionalFeatures: ['category chart'],
    requiredFiles: ['components/ExpenseTracker.tsx', 'components/TransactionForm.tsx', 'components/TransactionTable.tsx', 'components/SummaryCards.tsx', 'lib/expenseMath.ts', 'lib/mockTransactions.ts', 'types/expense.ts'],
    requiredComponents: ['ExpenseTracker', 'TransactionForm', 'TransactionTable', 'SummaryCards'],
    requiredLogic: ['add transaction state', 'income expense totals', 'category filtering'],
    forbiddenPatterns: [...baseForbidden, 'todo fallback'],
    validationRules: ['must include form and summary'],
    uiUxRules: ['finance dashboard'],
    mockDataRules: ['seed realistic transactions'],
  },
  bmi_calculator: {
    templateId: 'bmi_calculator',
    whenToUse: ['BMI', 'calculator', 'calculate'],
    requiredFeatures: ['height input', 'weight input', 'BMI result', 'category', 'health note', 'reset'],
    optionalFeatures: ['metric/imperial toggle'],
    requiredFiles: ['components/BmiCalculator.tsx', 'lib/bmi.ts', 'types/bmi.ts'],
    requiredComponents: ['BmiCalculator'],
    requiredLogic: ['calculateBmi', 'getBmiCategory'],
    forbiddenPatterns: [...baseForbidden, 'todo fallback'],
    validationRules: ['must calculate from height and weight'],
    uiUxRules: ['focused calculator tool'],
    mockDataRules: ['no mock data required'],
  },
  habit_tracker: {
    templateId: 'habit_tracker',
    whenToUse: ['habit tracker'],
    requiredFeatures: ['habit list', 'streaks', 'completion toggles'],
    optionalFeatures: ['weekly grid'],
    requiredFiles: ['components/HabitTracker.tsx'],
    requiredComponents: ['HabitTracker'],
    requiredLogic: ['toggle habit', 'streak display'],
    forbiddenPatterns: baseForbidden,
    validationRules: ['must track habits'],
    uiUxRules: ['progress dashboard'],
    mockDataRules: ['seed habits'],
  },
  task_manager: {
    templateId: 'task_manager',
    whenToUse: ['task tracker', 'todo'],
    requiredFeatures: ['create tasks', 'complete tasks', 'priority filters'],
    optionalFeatures: ['due dates'],
    requiredFiles: ['components/TaskManager.tsx'],
    requiredComponents: ['TaskManager'],
    requiredLogic: ['add/complete/filter tasks'],
    forbiddenPatterns: ['pricing', 'testimonials'],
    validationRules: ['allowed only for task/todo requests'],
    uiUxRules: ['task workspace'],
    mockDataRules: ['seed relevant tasks'],
  },
  admin_dashboard: {
    templateId: 'admin_dashboard',
    whenToUse: ['admin dashboard'],
    requiredFeatures: ['metrics', 'tables', 'filters'],
    optionalFeatures: ['charts'],
    requiredFiles: ['components/AdminDashboard.tsx'],
    requiredComponents: ['AdminDashboard'],
    requiredLogic: ['filter table data'],
    forbiddenPatterns: baseForbidden,
    validationRules: ['must be dashboard'],
    uiUxRules: ['dense operational UI'],
    mockDataRules: ['seed metrics'],
  },
  ecommerce_store: {
    templateId: 'ecommerce_store',
    whenToUse: ['store', 'shop', 'ecommerce'],
    requiredFeatures: ['product grid', 'cart', 'checkout mock'],
    optionalFeatures: ['filters'],
    requiredFiles: ['components/EcommerceStore.tsx'],
    requiredComponents: ['EcommerceStore'],
    requiredLogic: ['add to cart', 'cart total'],
    forbiddenPatterns: baseForbidden,
    validationRules: ['must include products/cart'],
    uiUxRules: ['commerce UI'],
    mockDataRules: ['seed products'],
  },
  portfolio_website: {
    templateId: 'portfolio_website',
    whenToUse: ['portfolio'],
    requiredFeatures: ['projects', 'skills', 'contact'],
    optionalFeatures: ['resume link'],
    requiredFiles: ['components/PortfolioWebsite.tsx'],
    requiredComponents: ['PortfolioWebsite'],
    requiredLogic: ['navigation'],
    forbiddenPatterns: ['todo fallback'],
    validationRules: ['may be website'],
    uiUxRules: ['personal website'],
    mockDataRules: ['seed portfolio projects'],
  },
  startup_landing_page: {
    templateId: 'startup_landing_page',
    whenToUse: ['landing page', 'marketing page', 'startup homepage', 'SaaS landing page', 'product page'],
    requiredFeatures: ['hero', 'features', 'CTA'],
    optionalFeatures: ['testimonials only if requested', 'pricing only if requested'],
    requiredFiles: ['components/StartupLandingPage.tsx'],
    requiredComponents: ['StartupLandingPage'],
    requiredLogic: ['CTA links'],
    forbiddenPatterns: ['tracker app', 'portal app', 'converter app'],
    validationRules: ['only select when user explicitly asks for landing page'],
    uiUxRules: ['marketing page'],
    mockDataRules: ['none'],
  },
  generic_functional_app: {
    templateId: 'generic_functional_app',
    whenToUse: ['domain app with no specific template'],
    requiredFeatures: ['main action', 'state', 'mock data', 'result UI'],
    optionalFeatures: ['filters'],
    requiredFiles: ['components/AppShell.tsx'],
    requiredComponents: ['AppShell'],
    requiredLogic: ['state management'],
    forbiddenPatterns: baseForbidden,
    validationRules: ['must not be docs-only'],
    uiUxRules: ['functional app'],
    mockDataRules: ['domain mock data'],
  },
};

export function getTemplateDefinition(templateId: ProjectTemplateKey): TemplateDefinition {
  return templateRegistry[templateId];
}
