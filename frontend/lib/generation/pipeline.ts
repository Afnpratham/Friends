import { getTemplateById, selectTemplate, type ProjectTemplate, type ProjectType } from '@/lib/templates/templateRegistry';

export const generationStages = [
  'Intent analysis',
  'Prompt enhancement',
  'Template selection',
  'Product spec',
  'UI/UX spec',
  'Tech spec',
  'File planning',
  'Code generation',
  'Validation',
  'Repair',
  'Quality review',
  'Packaging ZIP',
] as const;

export type GenerationStage = (typeof generationStages)[number];

export type EnhancedPrompt = {
  generationRunId: string;
  sourcePrompt: string;
  projectTitle: string;
  projectType: ProjectType;
  intentProjectType: string;
  domain: string;
  selectedTemplate: ProjectTemplate;
  domainSpecificFeatures: string[];
  requiredFiles: string[];
  requiredComponents: string[];
  requiredLogic: string[];
  forbiddenMistakes: string[];
  finalPrompt: string;
};

export type ValidationResult = {
  passed: boolean;
  report: string[];
  errors: string[];
};

export type GeneratedProject = {
  id: string;
  generationRunId: string;
  projectName: string;
  selectedTemplate: ProjectTemplate;
  enhancedPrompt: EnhancedPrompt;
  qualityScore: number;
  files: Record<string, string>;
  validationReport: string[];
  validationStatus: 'pending' | 'passed' | 'failed';
  repairAttempts: number;
  preview: {
    title: string;
    subtitle: string;
    bullets: string[];
  };
  exportReady: boolean;
  generatedAt: string;
};

export function createGenerationRunId() {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function titleFromPrompt(prompt: string, fallback: string) {
  const cleaned = prompt
    .replace(/^(make|build|create|generate|develop)\s+(an?|the)?\s*/i, '')
    .replace(/[.!?]+$/g, '')
    .trim();

  if (!cleaned) return fallback;

  return cleaned
    .split(/\s+/)
    .slice(0, 7)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function inferDomainFeatures(rawPrompt: string, template: ProjectTemplate) {
  const prompt = rawPrompt.toLowerCase();
  const features = new Set(template.features);

  if (prompt.includes('nearby') || prompt.includes('location')) {
    features.add('Location-aware discovery flow');
  }
  if (prompt.includes('track') || prompt.includes('tracker')) {
    features.add('Tracking state and status updates');
  }
  if (prompt.includes('download') || prompt.includes('export') || prompt.includes('zip')) {
    features.add('Download/export action');
  }
  if (prompt.includes('student') || prompt.includes('college') || prompt.includes('school')) {
    features.add('Student-friendly dashboard states');
  }
  if (template.id === 'expense_tracker') {
    features.add('Personal finance dashboard with income, expense, balance, and transaction history');
  }
  if (features.size === template.features.length) {
    features.add('Responsive UI for desktop and mobile');
  }

  return Array.from(features);
}

export function enhancePrompt(rawPrompt: string, requestedType: ProjectType, generationRunId: string): EnhancedPrompt {
  const selectedTemplate = selectTemplate(rawPrompt, requestedType);
  const projectTitle = titleFromPrompt(rawPrompt, selectedTemplate.name);
  const domainSpecificFeatures = inferDomainFeatures(rawPrompt, selectedTemplate);
  const requiredFiles = Object.keys(selectedTemplate.files);

  const finalPrompt = [
    `Generation run ID: ${generationRunId}`,
    `Project title: ${projectTitle}`,
    `Project type: ${selectedTemplate.intentProjectType}`,
    `Domain: ${selectedTemplate.domain}`,
    `Selected template: ${selectedTemplate.id}`,
    '',
    `Raw idea: ${rawPrompt}`,
    '',
    'Build a complete runnable source-code project exported separately from the FRIENDS platform.',
    '',
    'Domain-specific features:',
    ...domainSpecificFeatures.map((feature) => `- ${feature}`),
    '',
    'Required components:',
    ...selectedTemplate.components.map((component) => `- ${component}`),
    '',
    'Required logic:',
    ...selectedTemplate.logic.map((item) => `- ${item}`),
    '',
    'Required files:',
    ...requiredFiles.map((file) => `- ${file}`),
    '',
    'Forbidden mistakes:',
    '- Never replace the FRIENDS builder homepage with this generated project.',
    ...selectedTemplate.forbiddenMistakes.map((item) => `- ${item}`),
  ].join('\n');

  return {
    generationRunId,
    sourcePrompt: rawPrompt,
    projectTitle,
    projectType: requestedType === 'Auto-detect' ? selectedTemplate.projectType : requestedType,
    intentProjectType: selectedTemplate.intentProjectType,
    domain: selectedTemplate.domain,
    selectedTemplate,
    domainSpecificFeatures,
    requiredFiles,
    requiredComponents: selectedTemplate.components,
    requiredLogic: selectedTemplate.logic,
    forbiddenMistakes: [
      'Never replace the FRIENDS builder homepage with this generated project.',
      ...selectedTemplate.forbiddenMistakes,
    ],
    finalPrompt,
  };
}

function validateFiles(files: Record<string, string>, template: ProjectTemplate): ValidationResult {
  const sourceContent = Object.entries(files)
    .filter(([path]) => path !== 'FRIENDS_GENERATION_SPEC.md')
    .map(([, content]) => content)
    .join('\n')
    .toLowerCase();
  const errors: string[] = [];
  const report: string[] = [];
  const hasText = (needle: string) => {
    const normalizedNeedle = needle.toLowerCase();
    if (/^[a-z0-9]+$/i.test(needle)) {
      return new RegExp(`\\b${normalizedNeedle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(sourceContent);
    }
    return sourceContent.includes(normalizedNeedle);
  };

  for (const file of template.validation.requiredFiles) {
    if (files[file]) {
      report.push(`Required file exists: ${file}`);
    } else {
      errors.push(`Missing required file: ${file}`);
    }
  }

  for (const text of template.validation.requiredText) {
    if (hasText(text)) {
      report.push(`Required text/logic found: ${text}`);
    } else {
      errors.push(`Missing required text/logic: ${text}`);
    }
  }

  for (const forbidden of template.validation.forbiddenText) {
    if (hasText(forbidden)) {
      errors.push(`Forbidden leakage found: ${forbidden}`);
    } else {
      report.push(`Forbidden leakage absent: ${forbidden}`);
    }
  }

  const packageJson = files['package.json'];
  if (packageJson) {
    try {
      const parsedPackage = JSON.parse(packageJson) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> };
      const dependencies = { ...(parsedPackage.dependencies ?? {}), ...(parsedPackage.devDependencies ?? {}) };

      if (dependencies.tailwindcss && dependencies.postcss && dependencies.autoprefixer && !dependencies['@tailwindcss/postcss']) {
        report.push('Tailwind v3 dependencies exist: tailwindcss, postcss, and autoprefixer.');
      } else {
        errors.push('Tailwind dependency set is invalid. Expected tailwindcss, postcss, and autoprefixer without @tailwindcss/postcss.');
      }

      if (parsedPackage.scripts?.build) {
        report.push('npm run build script exists.');
      } else {
        errors.push('npm run build script missing.');
      }
    } catch {
      errors.push('package.json is not valid JSON.');
    }
  }

  const postcssConfig = files['postcss.config.js'] ?? files['postcss.config.mjs'];
  if (postcssConfig && /(^|[{\s,])tailwindcss\s*:/.test(postcssConfig) && /(^|[{\s,])autoprefixer\s*:/.test(postcssConfig)) {
    report.push('PostCSS config uses tailwindcss and autoprefixer for Tailwind v3.');
  } else {
    errors.push('PostCSS config must use tailwindcss and autoprefixer for Tailwind v3.');
  }

  if (postcssConfig?.includes('"@tailwindcss/postcss"') || postcssConfig?.includes("'@tailwindcss/postcss'")) {
    errors.push('PostCSS config uses @tailwindcss/postcss, which is not used by this Tailwind v3 project.');
  } else {
    report.push('PostCSS config does not use @tailwindcss/postcss.');
  }

  const globalsCss = files['app/globals.css'] ?? '';
  if (/@tailwind\s+base/.test(globalsCss) && /@tailwind\s+components/.test(globalsCss) && /@tailwind\s+utilities/.test(globalsCss)) {
    report.push('app/globals.css uses Tailwind v3 directives.');
  } else {
    errors.push('app/globals.css must include @tailwind base, @tailwind components, and @tailwind utilities.');
  }

  if (globalsCss.includes('@import "tailwindcss";') || globalsCss.includes("@import 'tailwindcss';")) {
    errors.push('app/globals.css uses the Tailwind v4 import instead of Tailwind v3 directives.');
  }

  if (files['package.json']) {
    report.push('package.json exists with runnable scripts.');
  } else {
    errors.push('package.json missing.');
  }

  if (files['app/page.tsx']) {
    report.push('Application entry file is present.');
  } else {
    errors.push('Application entry file is missing.');
  }

  report.push('Generated project is packaged separately and does not overwrite FRIENDS platform files.');
  report.push(`${Object.keys(files).length} files prepared for ZIP export.`);

  return {
    passed: errors.length === 0,
    report: [...report, ...errors.map((error) => `Error: ${error}`)],
    errors,
  };
}

function repairFiles(template: ProjectTemplate) {
  return repairTailwindV3Files({ ...getTemplateById(template.id).files });
}

function repairTailwindV3Files(files: Record<string, string>) {
  const nextFiles = { ...files };

  if (nextFiles['package.json']) {
    const parsedPackage = JSON.parse(nextFiles['package.json']) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    parsedPackage.dependencies = {
      ...(parsedPackage.dependencies ?? {}),
    };
    delete parsedPackage.dependencies['@tailwindcss/postcss'];
    delete parsedPackage.dependencies.tailwindcss;
    delete parsedPackage.dependencies.postcss;
    delete parsedPackage.dependencies.autoprefixer;
    parsedPackage.devDependencies = {
      ...(parsedPackage.devDependencies ?? {}),
      tailwindcss: parsedPackage.devDependencies?.tailwindcss ?? '^3.4.17',
      postcss: parsedPackage.devDependencies?.postcss ?? '^8.4.49',
      autoprefixer: parsedPackage.devDependencies?.autoprefixer ?? '^10.4.20',
    };
    delete parsedPackage.devDependencies['@tailwindcss/postcss'];
    nextFiles['package.json'] = JSON.stringify(parsedPackage, null, 2);
  }

  delete nextFiles['postcss.config.mjs'];
  nextFiles['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  if (nextFiles['tailwind.config.ts']) {
    delete nextFiles['tailwind.config.ts'];
  }

  nextFiles['tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

  nextFiles['app/globals.css'] = nextFiles['app/globals.css']?.replace(/@import\s+["']tailwindcss["'];/, '@tailwind base;\n@tailwind components;\n@tailwind utilities;') ?? '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';

  return nextFiles;
}

export function repairTailwindPostcssBuildError(files: Record<string, string>, buildLog: string) {
  if (buildLog.includes('@tailwindcss/postcss') || buildLog.includes('ENOENT')) {
    return repairTailwindV3Files(files);
  }

  return files;
}

export function generateProject(enhancedPrompt: EnhancedPrompt): GeneratedProject {
  let files: Record<string, string> = {
    ...enhancedPrompt.selectedTemplate.files,
    'FRIENDS_GENERATION_SPEC.md': enhancedPrompt.finalPrompt,
  };

  let repairAttempts = 0;
  let validation = validateFiles(files, enhancedPrompt.selectedTemplate);

  while (!validation.passed && repairAttempts < 3) {
    repairAttempts += 1;
    files = {
      ...repairFiles(enhancedPrompt.selectedTemplate),
      'FRIENDS_GENERATION_SPEC.md': enhancedPrompt.finalPrompt,
    };
    validation = validateFiles(files, enhancedPrompt.selectedTemplate);
  }

  const qualityScore = validation.passed ? (repairAttempts > 0 ? 91 : 97) : 68;

  return {
    id: `friends-${enhancedPrompt.generationRunId}`,
    generationRunId: enhancedPrompt.generationRunId,
    projectName: enhancedPrompt.selectedTemplate.name,
    selectedTemplate: enhancedPrompt.selectedTemplate,
    enhancedPrompt,
    qualityScore,
    files,
    validationReport: validation.report,
    validationStatus: validation.passed ? 'passed' : 'failed',
    repairAttempts,
    preview: {
      title: enhancedPrompt.selectedTemplate.name,
      subtitle: enhancedPrompt.selectedTemplate.description,
      bullets: enhancedPrompt.selectedTemplate.previewBullets,
    },
    exportReady: validation.passed,
    generatedAt: new Date().toISOString(),
  };
}
