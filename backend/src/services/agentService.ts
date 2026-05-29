/**
 * Agent Service
 * Builds system prompts and runs individual agents using OpenAI.
 * Handles the prompt template system for all 4 workflow types.
 */

import { generateAgentOutput } from './geminiService';
import { Agent, Project, ClarificationQA, AgentTemplate, WorkflowType } from '../types';

// ─── Prompt Builder ───────────────────────────────────────────────────────────

/**
 * Builds the system prompt for an agent based on its role, task, and project context.
 */
export function buildAgentSystemPrompt(
  agent: Agent,
  project: Project,
  previousOutputs: { role: string; output: string }[] = []
): string {
  const projectBrief = project.enhanced_prompt || project.description;
  const clarificationsText = project.clarifications
    ? project.clarifications
        .map((qa: ClarificationQA) => `Q: ${qa.question}\nA: ${qa.answer}`)
        .join('\n\n')
    : 'No additional context provided.';

  const previousOutputsText =
    previousOutputs.length > 0
      ? previousOutputs
          .map((o) => `### ${o.role} Output:\n${o.output}`)
          .join('\n\n---\n\n')
      : 'You are the first agent to work on this project.';

  return `You are a ${agent.role} AI agent working as part of the FRIENDS multi-agent AI platform.

## Project Overview
**Title**: ${project.title}
**Workflow Type**: ${project.workflow_type}
**Raw User Prompt**: ${project.raw_prompt || project.description}
**Enhanced Requirement Prompt**:
${projectBrief}

## User Context (Clarifications)
${clarificationsText}

## Previous Agent Outputs (for context)
${previousOutputsText}

## Your Assignment
**Your Role**: ${agent.role}
**Your Name**: ${agent.name}
**Your Task**: ${agent.task}
**Expected Output Format**: ${agent.expected_output}

## Guidelines
- Be specific, detailed, and technical where appropriate
- Use Markdown formatting with clear headers and sections
- Do NOT include preambles like "Sure, I'll help with..."
- Do NOT include meta-commentary about what you're doing
- Focus exclusively on your assigned task
- Build upon the previous agents' outputs where relevant
- Produce output that is immediately useful and actionable
- Target audience: developers, founders, and students`;
}

/**
 * Runs a single agent and returns its generated output.
 */
export async function runAgent(
  agent: Agent,
  project: Project,
  previousOutputs: { role: string; output: string }[] = [],
  userApiKey?: string | null
): Promise<string> {
  const systemPrompt = buildAgentSystemPrompt(agent, project, previousOutputs);

  const userMessage = `Execute your role as ${agent.role} for the following project:

Project: ${project.title}
Goal: ${project.enhanced_prompt || project.description}

Complete your specific task: ${agent.task}`;

  return generateAgentOutput(systemPrompt, userMessage, userApiKey);
}

// ─── Workflow Templates ───────────────────────────────────────────────────────

/**
 * Pre-built agent templates for each workflow type.
 * These are the default agent configurations that users can customize.
 */
export const WORKFLOW_TEMPLATES: Record<WorkflowType, AgentTemplate[]> = {
  website: [
    {
      name: 'Product Manager',
      role: 'Product Manager',
      task: 'Define the product requirements, user stories, success metrics, and project scope for this website.',
      expected_output:
        'A structured requirements document with: project overview, target audience, core features, user stories (as a user I want...), success metrics, and scope boundaries.',
      order_index: 0,
    },
    {
      name: 'UI/UX Designer',
      role: 'UI/UX Designer',
      task: 'Design the complete UI/UX for this website including page layouts, navigation flow, color palette, typography, and component structure.',
      expected_output:
        'A detailed UI/UX specification with: site map, page-by-page wireframe descriptions, color palette (hex codes), typography choices, component list, and UX flow diagrams in text form.',
      order_index: 1,
    },
    {
      name: 'Frontend Developer',
      role: 'Frontend Developer',
      task: 'Create the complete frontend app source code for this website including HTML structure, CSS styling, JavaScript interactions, validation, responsive behavior, and clear run instructions.',
      expected_output:
        'Complete, working frontend code with: a file tree, full copy-paste-ready code for every file, responsive CSS, JavaScript functionality, accessibility labels, and exact steps to run locally. For simple apps, include a self-contained index.html.',
      order_index: 2,
    },
    {
      name: 'Backend Developer',
      role: 'Backend Developer',
      task: 'Design any backend architecture needed for this website. If the app can run fully in the browser, clearly state that no backend is required.',
      expected_output:
        'A backend decision document with either: "No backend required" and why, or a complete backend specification with API endpoints, database schema, authentication, and setup steps.',
      order_index: 3,
    },
    {
      name: 'QA Tester',
      role: 'QA Tester',
      task: 'Create a comprehensive testing plan including test cases, edge cases, accessibility checks, and performance benchmarks.',
      expected_output:
        'A testing document with: unit test cases, integration test scenarios, edge cases, accessibility checklist (WCAG 2.1), browser compatibility matrix, and performance benchmarks.',
      order_index: 4,
    },
    {
      name: 'Documentation Writer',
      role: 'Documentation Writer',
      task: 'Write the complete project documentation including README, setup guide, API documentation, and deployment instructions.',
      expected_output:
        'Full documentation with: README.md, local setup steps, environment variables list, API documentation, deployment guide for Vercel/Netlify, and troubleshooting section.',
      order_index: 5,
    },
    {
      name: 'Code Packager',
      role: 'Code Packager',
      task: 'Convert the approved requirements into a complete runnable Next.js project file map suitable for ZIP export. Select and follow the domain-specific template exactly. If the request is for a portal, app, dashboard, tracker, converter, management system, calculator, generator, or checker, generate a functional app/dashboard, not a landing page.',
      expected_output:
        'Return only a structured JSON file map: {"projectName":"...","projectType":"functional_web_app","files":[{"path":"package.json","content":"..."},{"path":"app/page.tsx","content":"..."}]}. Do not output prose as code, do not reuse unrelated templates, and do not include components unrelated to the project domain.',
      order_index: 6,
    },
  ],

  startup: [
    {
      name: 'Market Researcher',
      role: 'Market Research Analyst',
      task: 'Conduct comprehensive market research including TAM/SAM/SOM analysis, competitor landscape, market trends, and customer pain points.',
      expected_output:
        'Market research report with: market size (TAM/SAM/SOM with figures), top 5 competitors analysis (features, pricing, strengths, weaknesses), market trends, customer segments, and validated pain points.',
      order_index: 0,
    },
    {
      name: 'Business Strategist',
      role: 'Business Strategist',
      task: 'Develop the complete business strategy including business model canvas, value proposition, competitive moat, and go-to-market strategy.',
      expected_output:
        'Business strategy document with: business model canvas (all 9 blocks), value proposition statement, competitive advantage analysis, go-to-market strategy, key partnerships, and initial customer acquisition plan.',
      order_index: 1,
    },
    {
      name: 'Product Manager',
      role: 'Product Manager',
      task: 'Define the MVP feature set, product roadmap, user personas, and product-market fit hypothesis.',
      expected_output:
        'Product document with: user personas (2-3 detailed), MVP feature list with prioritization (MoSCoW), product roadmap (3-6-12 months), key metrics to track, and product-market fit hypothesis.',
      order_index: 2,
    },
    {
      name: 'Monetization Expert',
      role: 'Monetization Strategist',
      task: 'Design the complete monetization strategy including pricing tiers, revenue streams, freemium model, and financial projections.',
      expected_output:
        'Monetization plan with: pricing tier structure (Free/Pro/Team/Enterprise), revenue streams (primary and secondary), freemium conversion strategy, 12-month revenue projection model, and unit economics.',
      order_index: 3,
    },
    {
      name: 'Brand Strategist',
      role: 'Brand Strategist',
      task: 'Create the complete brand identity including name validation, tagline, brand values, visual identity guidelines, and tone of voice.',
      expected_output:
        'Brand identity document with: brand name analysis, 3 tagline options, brand values and mission statement, visual identity guidelines (colors, typography, logo concept), tone of voice guide, and brand story.',
      order_index: 4,
    },
    {
      name: 'Pitch Deck Writer',
      role: 'Pitch Deck Specialist',
      task: 'Create the complete content for a 10-slide investor pitch deck following the standard VC format.',
      expected_output:
        'Pitch deck content for 10 slides: (1) Title/Hook, (2) Problem, (3) Solution, (4) Market Size, (5) Product, (6) Business Model, (7) Traction/Roadmap, (8) Team, (9) Financials, (10) Ask. Each slide with headline and 3-5 bullet points.',
      order_index: 5,
    },
    {
      name: 'Risk Analyst',
      role: 'Risk Analyst',
      task: 'Identify and analyze all key risks (market, technical, financial, regulatory) and develop mitigation strategies.',
      expected_output:
        'Risk analysis with: risk matrix (probability × impact), top 10 risks across categories (market/technical/financial/legal), mitigation strategy for each, contingency plans, and risk monitoring framework.',
      order_index: 6,
    },
    {
      name: 'Code Packager',
      role: 'Code Packager',
      task: 'Create a runnable landing page or MVP scaffold for this startup, plus package the startup documents into a ZIP-ready file map.',
      expected_output:
        'A JSON file map with Next.js landing page/MVP scaffold files, README.md, pitch deck outline, go-to-market document, roadmap, and setup instructions.',
      order_index: 7,
    },
  ],

  student: [
    {
      name: 'Idea Generator',
      role: 'Project Idea Specialist',
      task: 'Generate a unique, innovative, and feasible project idea with full justification of its novelty and value.',
      expected_output:
        'Project concept with: project title, problem statement, proposed solution, novelty score (1-10) with justification, similar existing projects and how this differs, complexity level, and estimated completion time.',
      order_index: 0,
    },
    {
      name: 'System Designer',
      role: 'System Design Engineer',
      task: 'Design the complete system architecture including tech stack selection, component diagram, data flow, and scalability considerations.',
      expected_output:
        'System design document with: recommended tech stack with justification, high-level architecture diagram (text-based), component breakdown, data flow description, database choice and schema, API design pattern, and scalability notes.',
      order_index: 1,
    },
    {
      name: 'Code Planner',
      role: 'Software Engineer',
      task: 'Create a detailed implementation plan including module breakdown, class/function structure, algorithm choices, and step-by-step coding guide.',
      expected_output:
        'Implementation plan with: folder structure, key modules and their responsibilities, class/function signatures, algorithm choices with complexity analysis, API endpoint list, implementation phases, and estimated hours per phase.',
      order_index: 2,
    },
    {
      name: 'Documentation Writer',
      role: 'Technical Writer',
      task: 'Write complete project documentation suitable for GitHub submission including README, setup guide, API docs, and project report.',
      expected_output:
        'Complete documentation with: GitHub README.md template, local setup instructions, API documentation, database schema description, project report outline (abstract, intro, methodology, results, conclusion), and contribution guidelines.',
      order_index: 3,
    },
    {
      name: 'Resume Builder',
      role: 'Career Coach',
      task: 'Create compelling resume bullet points and LinkedIn project description for this project that will impress recruiters.',
      expected_output:
        'Career assets with: 4-5 resume bullet points (action verb + task + result with metrics), LinkedIn project description (3-4 sentences), GitHub repository description, key skills to list, and interview talking points about this project.',
      order_index: 4,
    },
    {
      name: 'Viva Prep Coach',
      role: 'Academic Viva Coach',
      task: 'Generate comprehensive viva/presentation Q&A covering all aspects of the project across difficulty levels.',
      expected_output:
        '25 viva Q&As organized by: Basic Questions (5, conceptual), Technical Questions (10, architecture/code/algorithms), Advanced Questions (7, scalability/security/improvements), Tricky Questions (3, edge cases/failures). Each with model answer.',
      order_index: 5,
    },
    {
      name: 'Code Packager',
      role: 'Code Packager',
      task: 'Create a complete runnable student project scaffold with source code, README, report, viva questions, resume points, and ZIP-ready file map. Preserve the exact domain requested by the user and generate a functional app/dashboard when the prompt asks for a portal, tracker, checker, calculator, generator, converter, or management system.',
      expected_output:
        'Return only a structured JSON file map: {"projectName":"...","projectType":"functional_web_app","files":[{"path":"package.json","content":"..."},{"path":"app/page.tsx","content":"..."}]}. Include source code files, package.json, setup instructions, README.md, project-report.md, viva-questions.md, and resume-points.md. Do not include unrelated landing-page sections.',
      order_index: 6,
    },
  ],

  custom: [], // Custom workflows have user-defined agents
};

/**
 * Returns the default agent templates for a given workflow type.
 */
export function getWorkflowAgents(workflowType: WorkflowType): AgentTemplate[] {
  return WORKFLOW_TEMPLATES[workflowType] || [];
}
