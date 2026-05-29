/**
 * Compiler Service
 * The Compiler Agent synthesizes all individual agent outputs into one
 * cohesive, structured final project document.
 */

import { generateAgentOutput } from './geminiService';
import { Agent, Project } from '../types';

/**
 * Builds the compiler agent system prompt.
 */
function buildCompilerSystemPrompt(project: Project, _agents: Agent[]): string {
  const projectBrief = project.enhanced_prompt || project.description;
  const workflowSections: Record<string, string[]> = {
    website: [
      'Start Here',
      'Complete App Source Code',
      'File Tree',
      'index.html',
      'styles.css',
      'script.js',
      'README',
      'How to Run',
    ],
    startup: [
      'problem statement',
      'target audience',
      'MVP features',
      'monetization',
      'go-to-market strategy',
      'roadmap',
      'pitch deck outline',
    ],
    student: [
      'project idea',
      'features',
      'architecture',
      'database schema',
      'APIs',
      'implementation roadmap',
      'README content',
      'resume points',
      'viva questions',
    ],
  };
  const requiredSections = workflowSections[project.workflow_type] || [
    'project goal',
    'agent findings',
    'deliverables',
    'risks',
    'next steps',
  ];
  const clarificationsText = project.clarifications?.length
    ? project.clarifications.map((qa) => `- ${qa.question}: ${qa.answer}`).join('\n')
    : 'No clarifying answers were provided.';

  const websiteInstructions =
    project.workflow_type === 'website'
      ? `
## Website Builder Output Contract
The user expects a complete working app, not a strategy report.

For Website Builder projects, your final output MUST:
- Start with "# ${project.title} - Complete Website App"
- Include a "Start Here" section with exact run instructions
- Include a complete file tree
- Include complete, copy-paste-ready source code for every required file
- For simple apps such as calculators, provide a self-contained single-file HTML version first, then optional split files
- Use fenced code blocks with filenames immediately before each code block
- Make the code runnable by saving the files locally and opening index.html
- Include validation, accessibility labels, empty/error states, responsive CSS, and clear UI text
- If no backend is needed, explicitly say "No backend required" instead of inventing an API
- Do not stop at requirements, UI descriptions, or code outlines
- Do not describe what code should do without providing the full code
`
      : '';
  const packageInstructions =
    project.workflow_type !== 'website'
      ? `
## ZIP-Friendly Output Contract
The user downloads the final project as a ZIP file, so the output must be organized like a project package, not a PDF-only report.

Include complete Markdown files as fenced code blocks with filenames immediately before each block.
Use these package files for this workflow:
${
  project.workflow_type === 'startup'
    ? `- README.md
- business-plan.md
- market-research.md
- mvp-roadmap.md
- go-to-market.md
- pitch-deck-outline.md`
    : project.workflow_type === 'student'
      ? `- README.md
- project-report.md
- implementation-roadmap.md
- architecture.md
- viva-questions.md
- resume-points.md`
      : `- README.md
- final-output.md
- agent-plan.md
- next-steps.md`
}

Each file must be complete enough to stand alone after download.
Do not frame the final artifact as a PDF. The ZIP is the primary downloadable artifact.
`
      : '';

  return `You are the Compiler Agent for the FRIENDS AI platform — the final agent in a multi-agent pipeline.

Your job is to synthesize the outputs from all specialized agents into ONE cohesive, well-structured project package.
${websiteInstructions}
${packageInstructions}

## Your Responsibilities:
1. Merge all agent outputs into a single, logical document
2. Eliminate redundancy while preserving all critical information
3. Ensure consistent formatting throughout
4. For Website Builder projects, prioritize runnable source code above planning sections
5. Add a Table of Contents
6. Add a "Next Steps" section at the end
7. Make the document immediately actionable

## Required File Map Contract
The final output MUST include a fenced JSON block containing this exact shape:

\`\`\`json
{
  "files": [
    {
      "path": "package.json",
      "content": "..."
    },
    {
      "path": "app/page.tsx",
      "content": "..."
    }
  ]
}
\`\`\`

The ZIP exporter reads only this file map for source-code export. Do not rely on prose or isolated code snippets.

For any runnable app/website package, the file map must include:
- package.json
- next.config.js
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- app/page.tsx
- app/layout.tsx
- app/globals.css
- README.md
- at least one component file under components/

Use project paths exactly as they should appear inside the ZIP root.

## Document Structure:
- Executive Summary
- Table of Contents
- Required ${project.workflow_type} sections:
${requiredSections.map((section) => `  - ${section}`).join('\n')}
- Supporting agent details where useful
- Next Steps & Action Items
- Resources & References

## Formatting Rules:
- Use Markdown with proper heading hierarchy (# ## ###)
- Use code blocks for all code snippets
- Use tables for structured data
- Use bullet points for lists
- Keep professional, clear, and concise language
- Add horizontal rules (---) between major sections

Project: ${project.title}
Workflow: ${project.workflow_type}
Raw prompt: ${project.raw_prompt || project.description}
Enhanced requirement prompt:
${projectBrief}

Clarifying answers from the user:
${clarificationsText}`;
}

/**
 * Builds the user message for the compiler with all agent outputs.
 */
function buildCompilerUserMessage(agents: Agent[]): string {
  const completedAgents = agents.filter((a) => a.status === 'completed' && a.output);

  if (completedAgents.length === 0) {
    throw new Error('No completed agent outputs to compile');
  }

  const agentOutputs = completedAgents
    .sort((a, b) => a.order_index - b.order_index)
    .map(
      (agent) => `## ${agent.name} (${agent.role})
Task: ${agent.task}

${agent.output}`
    )
    .join('\n\n---\n\n');

  return `Synthesize the following ${completedAgents.length} agent outputs into one final downloadable project package:

${agentOutputs}

If this is a Website Builder project, produce the complete working app source code, including a runnable index.html. Do not output only a report or implementation plan.`;
}

/**
 * Runs the Compiler Agent to synthesize all agent outputs.
 * @param project - The project being compiled
 * @param agents - All agents (with their outputs)
 * @param userApiKey - Optional user OpenAI key
 */
export async function compileProjectOutputs(
  project: Project,
  agents: Agent[],
  userApiKey?: string | null
): Promise<string> {
  const systemPrompt = buildCompilerSystemPrompt(project, agents);
  const userMessage = buildCompilerUserMessage(agents);

  return generateAgentOutput(systemPrompt, userMessage, userApiKey);
}

/**
 * Generates a quick summary of the project for the dashboard.
 */
export async function generateProjectSummary(
  project: Project,
  compiledContent: string,
  userApiKey?: string | null
): Promise<string> {
  const systemPrompt = `You are a concise project summarizer. 
Given a compiled project document, write a 2-3 sentence executive summary suitable for a project card on a dashboard.
Return ONLY the summary text, no formatting.`;

  const userMessage = `Project: ${project.title}
Workflow: ${project.workflow_type}

Compiled document (first 2000 chars):
${compiledContent.substring(0, 2000)}

Write a 2-3 sentence summary.`;

  return generateAgentOutput(systemPrompt, userMessage, userApiKey);
}
