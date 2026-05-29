import { GeneratedProjectType, Project, ProjectTemplateKey, QualityScore } from '../types';
import { getTemplateDefinition } from '../lib/templates/templateRegistry';

export interface ProjectFile {
  path: string;
  content: string;
  purpose?: string;
}

export interface UiUxSpec {
  designStyle: string;
  colorPalette: string[];
  typography: string;
  layoutRules: string[];
  components: string[];
  responsiveRules: string[];
  emptyStates: string[];
  loadingStates: string[];
  errorStates: string[];
  microInteractions: string[];
  accessibilityRules: string[];
}

export interface FilePlan {
  projectName: string;
  projectType: GeneratedProjectType;
  selectedTemplate: ProjectTemplateKey;
  files: string[];
  domainSpecificRequirements: string[];
  uiUxSpec: UiUxSpec;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: QualityScore;
}

const allBaseFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.ts',
  'postcss.config.js',
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  'README.md',
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'friends-project';
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function selectProjectTemplate(rawPrompt: string, workflowType?: string): ProjectTemplateKey {
  const text = `${rawPrompt} ${workflowType || ''}`.toLowerCase();
  const explicitLanding = ['landing page', 'marketing page', 'startup homepage', 'saas landing page', 'product page'].some((term) => text.includes(term));

  if (includesAny(text, ['ambulance', 'live location', 'nearby ambulance', 'route', 'eta']) || (text.includes('tracker') && includesAny(text, ['map', 'nearby', 'location']))) return 'ambulance_tracker';
  if (text.includes('pdf') && includesAny(text, ['notes', 'upload', 'document', 'summarize', 'summary', 'converter'])) return 'pdf_to_notes_converter';
  if (text.includes('attendance') && includesAny(text, ['student', 'portal', 'college', 'school'])) return 'student_attendance_portal';
  if (text.includes('bmi') || (text.includes('calculator') && text.includes('weight'))) return 'bmi_calculator';
  if (includesAny(text, ['expense tracker', 'transaction', 'budget'])) return 'expense_tracker';
  if (text.includes('habit tracker')) return 'habit_tracker';
  if (includesAny(text, ['task tracker', 'todo', 'to-do'])) return 'task_manager';
  if (text.includes('admin dashboard')) return 'admin_dashboard';
  if (includesAny(text, ['ecommerce', 'store', 'shop'])) return 'ecommerce_store';
  if (text.includes('portfolio')) return 'portfolio_website';
  if (explicitLanding) return 'startup_landing_page';
  if (includesAny(text, ['tracker', 'portal', 'dashboard', 'converter', 'calculator', 'management system', 'checker', 'generator', 'app', 'tool'])) return 'generic_functional_app';
  return 'generic_functional_app';
}

export function isFunctionalAppRequest(rawPrompt: string): boolean {
  return selectProjectTemplate(rawPrompt) !== 'startup_landing_page' && selectProjectTemplate(rawPrompt) !== 'portfolio_website';
}

export function createDefaultUiUxSpec(template: ProjectTemplateKey): UiUxSpec {
  const definition = getTemplateDefinition(template);
  return {
    designStyle: definition.uiUxRules.join('; ') || 'Polished functional app',
    colorPalette: ['#0f172a', '#2563eb', '#14b8a6', '#f59e0b', '#ef4444', '#f8fafc'],
    typography: 'Modern sans-serif with clear hierarchy and compact app controls',
    layoutRules: ['Make the actual app workflow the first screen', 'Use cards/tables/forms only where useful', 'Avoid marketing sections unless landing page selected'],
    components: definition.requiredComponents,
    responsiveRules: ['Mobile-first stacked layout', 'Two-column workspace on desktop where helpful', 'Large touch targets on mobile'],
    emptyStates: ['Show useful empty states for no results or no selection'],
    loadingStates: ['Show clear loading labels and disabled duplicate actions'],
    errorStates: ['Show recoverable errors with specific messages'],
    microInteractions: ['Hover states', 'Focus rings', 'Selection states', 'Copied/requested confirmations'],
    accessibilityRules: ['Labeled controls', 'Keyboard reachable actions', 'Readable contrast', 'Do not rely on color alone'],
  };
}

export function getDomainRequirements(template: ProjectTemplateKey): string[] {
  return getTemplateDefinition(template).requiredFeatures;
}

export function createFilePlan(project: Project): FilePlan {
  const rawPrompt = project.raw_prompt || project.description || project.enhanced_prompt || project.title;
  const selectedTemplate = selectProjectTemplate(rawPrompt, project.workflow_type);
  const definition = getTemplateDefinition(selectedTemplate);
  const projectType: GeneratedProjectType = selectedTemplate === 'startup_landing_page' || selectedTemplate === 'portfolio_website'
    ? 'landing_page'
    : selectedTemplate === 'student_attendance_portal' || selectedTemplate === 'expense_tracker' || selectedTemplate === 'admin_dashboard'
      ? 'dashboard_app'
      : 'functional_web_app';

  return {
    projectName: selectedTemplate === 'student_attendance_portal' ? 'student-attendance-portal' : slugify(project.title || selectedTemplate),
    projectType,
    selectedTemplate,
    files: Array.from(new Set([...allBaseFiles, ...definition.requiredFiles])),
    domainSpecificRequirements: definition.requiredFeatures,
    uiUxSpec: createDefaultUiUxSpec(selectedTemplate),
  };
}

function packageJson(name: string, extraDependencies: Record<string, string> = {}): ProjectFile {
  return {
    path: 'package.json',
    content: JSON.stringify({
      name,
      version: '1.0.0',
      private: true,
      scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
      dependencies: {
        '@types/node': '^20.14.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        autoprefixer: '^10.4.20',
        next: '^16.2.6',
        postcss: '^8.4.38',
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        tailwindcss: '^3.4.4',
        typescript: '^5.4.5',
        ...extraDependencies,
      },
      devDependencies: {},
    }, null, 2),
  };
}

function baseFiles(name: string, title: string, extraDependencies: Record<string, string> = {}): ProjectFile[] {
  return [
    packageJson(name, extraDependencies),
    { path: 'next.config.js', content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;\n` },
    { path: 'tsconfig.json', content: JSON.stringify({ compilerOptions: { target: 'es5', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: 'esnext', moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true, jsx: 'preserve', incremental: true, plugins: [{ name: 'next' }], paths: { '@/*': ['./*'] } }, include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'], exclude: ['node_modules'] }, null, 2) },
    { path: 'tailwind.config.ts', content: `import type { Config } from 'tailwindcss';\nconst config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'], theme: { extend: { boxShadow: { soft: '0 18px 50px rgba(15, 23, 42, 0.10)' } } }, plugins: [] };\nexport default config;\n` },
    { path: 'postcss.config.js', content: `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n` },
    { path: 'app/layout.tsx', content: `import type { Metadata } from 'next';\nimport './globals.css';\nexport const metadata: Metadata = { title: '${title}', description: 'Generated by FRIENDS.' };\nexport default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }\n` },
    { path: 'app/globals.css', content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a}button,input,select,textarea{font:inherit}.focus-ring:focus{outline:3px solid rgba(37,99,235,.28);outline-offset:2px}\n` },
  ];
}

function readme(title: string, features: string[], extra = ''): ProjectFile {
  return {
    path: 'README.md',
    content: `# ${title}\n\nA runnable Next.js project generated by FRIENDS.\n\n## Features\n\n${features.map((feature) => `- ${feature}`).join('\n')}\n\n## Setup\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nOpen http://localhost:3000.\n${extra}\n`,
  };
}

function ambulanceTrackerFiles(name: string): ProjectFile[] {
  return [
    ...baseFiles(name, 'Ambulance Tracker'),
    { path: 'types/ambulance.ts', content: `export type AmbulanceStatus='available'|'en-route'|'busy';export interface Coordinates{lat:number;lng:number}export interface Ambulance{id:string;name:string;driver:string;hospital:string;status:AmbulanceStatus;location:Coordinates;updatedAt:string}\n` },
    { path: 'lib/location.ts', content: `import { Ambulance, Coordinates } from '@/types/ambulance';\nexport const userLocation:Coordinates={lat:19.076,lng:72.8777};\nexport function calculateDistanceKm(a:Coordinates,b:Coordinates){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const s=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return Math.round(R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s))*10)/10}\nexport function calculateEtaMinutes(km:number){return Math.max(3,Math.round(km*4+2))}\nexport function sortAmbulancesByDistance(items:Ambulance[]){return [...items].sort((a,b)=>calculateDistanceKm(userLocation,a.location)-calculateDistanceKm(userLocation,b.location))}\n` },
    { path: 'lib/mockAmbulances.ts', content: `import { Ambulance } from '@/types/ambulance';\nexport const mockAmbulances:Ambulance[]=[{id:'AMB-102',name:'Rapid Response 102',driver:'Amit Rao',hospital:'CityCare Hospital',status:'available',location:{lat:19.082,lng:72.884},updatedAt:'now'},{id:'AMB-214',name:'LifeLine 214',driver:'Neha Shah',hospital:'Metro General',status:'en-route',location:{lat:19.067,lng:72.872},updatedAt:'1 min ago'},{id:'AMB-309',name:'MediFast 309',driver:'Kabir Khan',hospital:'Sunrise Trauma Center',status:'available',location:{lat:19.094,lng:72.861},updatedAt:'2 min ago'}];\n` },
    { path: 'components/StatusBadge.tsx', content: `import { AmbulanceStatus } from '@/types/ambulance';\nconst styles:Record<AmbulanceStatus,string>={available:'bg-emerald-100 text-emerald-700', 'en-route':'bg-blue-100 text-blue-700', busy:'bg-rose-100 text-rose-700'};export default function StatusBadge({status}:{status:AmbulanceStatus}){return <span className={\`rounded-full px-3 py-1 text-xs font-bold \${styles[status]}\`}>{status}</span>}\n` },
    { path: 'components/AmbulanceCard.tsx', content: `import { Ambulance } from '@/types/ambulance';import { calculateDistanceKm, calculateEtaMinutes, userLocation } from '@/lib/location';import StatusBadge from './StatusBadge';\nexport default function AmbulanceCard({ambulance,selected,onSelect}:{ambulance:Ambulance;selected:boolean;onSelect:()=>void}){const km=calculateDistanceKm(userLocation,ambulance.location);return <button onClick={onSelect} className={\`w-full rounded-2xl border p-4 text-left shadow-soft transition hover:-translate-y-0.5 \${selected?'border-blue-500 bg-blue-50':'border-slate-200 bg-white'}\`}><div className=\"flex items-start justify-between gap-3\"><div><p className=\"font-black text-slate-950\">{ambulance.name}</p><p className=\"text-sm text-slate-500\">{ambulance.driver} - {ambulance.hospital}</p></div><StatusBadge status={ambulance.status}/></div><div className=\"mt-3 grid grid-cols-2 gap-2 text-sm\"><span className=\"rounded-xl bg-slate-100 p-2\">{km} km away</span><span className=\"rounded-xl bg-slate-100 p-2\">ETA {calculateEtaMinutes(km)} min</span></div></button>}\n` },
    { path: 'components/AmbulanceList.tsx', content: `import { Ambulance } from '@/types/ambulance';import AmbulanceCard from './AmbulanceCard';\nexport default function AmbulanceList({items,selectedId,onSelect}:{items:Ambulance[];selectedId:string;onSelect:(id:string)=>void}){if(!items.length)return <div className=\"rounded-2xl border border-dashed p-8 text-center\">No nearby ambulances found.</div>;return <div className=\"space-y-3\">{items.map((a)=><AmbulanceCard key={a.id} ambulance={a} selected={a.id===selectedId} onSelect={()=>onSelect(a.id)}/>)}</div>}\n` },
    { path: 'components/MapPanel.tsx', content: `import { Ambulance } from '@/types/ambulance';import { calculateDistanceKm, userLocation } from '@/lib/location';\nexport default function MapPanel({items,selectedId}:{items:Ambulance[];selectedId:string}){return <section className=\"relative min-h-[360px] overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-soft\"><div className=\"absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:48px_48px]\"/><div className=\"relative\"><p className=\"text-sm text-blue-200\">Mock live map</p><h2 className=\"text-2xl font-black\">Nearby ambulance locations</h2></div><div className=\"relative mt-12 h-56\"> <div className=\"absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 ring-8 ring-blue-400/20\" title=\"Your location\"/>{items.map((a,i)=><div key={a.id} className={\`absolute rounded-2xl px-3 py-2 text-xs font-bold shadow-soft \${a.id===selectedId?'bg-emerald-400 text-slate-950':'bg-white text-slate-950'}\`} style={{left:\`\${18+i*26}%\`,top:\`\${20+(i%2)*44}%\`}}>{a.id}<br/>{calculateDistanceKm(userLocation,a.location)} km</div>)}</div></section>}\n` },
    { path: 'components/LocationPermissionCard.tsx', content: `export default function LocationPermissionCard({enabled,onEnable}:{enabled:boolean;onEnable:()=>void}){return <div className=\"rounded-2xl border border-slate-200 bg-white p-4 shadow-soft\"><p className=\"font-bold\">Location status</p><p className=\"mt-1 text-sm text-slate-500\">{enabled?'Using mock current location near Mumbai.':'Enable mock location to sort nearby ambulances.'}</p><button onClick={onEnable} className=\"mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white\">{enabled?'Location active':'Enable location'}</button></div>}\n` },
    { path: 'components/EmergencyActions.tsx', content: `export default function EmergencyActions(){return <div className=\"rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800\"><p className=\"font-black\">Emergency safety note</p><p className=\"mt-1 text-sm\">If this is a real emergency, call your local emergency number immediately. This demo uses mock data and does not contact hospitals.</p></div>}\n` },
    { path: 'components/AmbulanceDetails.tsx', content: `import { Ambulance } from '@/types/ambulance';import { calculateDistanceKm, calculateEtaMinutes, userLocation } from '@/lib/location';import StatusBadge from './StatusBadge';\nexport default function AmbulanceDetails({ambulance,onRequest,requested}:{ambulance:Ambulance;onRequest:()=>void;requested:boolean}){const km=calculateDistanceKm(userLocation,ambulance.location);return <section className=\"rounded-2xl border border-slate-200 bg-white p-5 shadow-soft\"><div className=\"flex items-start justify-between\"><div><p className=\"text-xs font-bold text-slate-400\">SELECTED AMBULANCE</p><h2 className=\"text-xl font-black\">{ambulance.name}</h2><p className=\"text-sm text-slate-500\">{ambulance.driver} - {ambulance.hospital}</p></div><StatusBadge status={ambulance.status}/></div><div className=\"mt-4 grid grid-cols-2 gap-3\"><div className=\"rounded-xl bg-slate-50 p-3\"><p className=\"text-2xl font-black\">{km} km</p><p className=\"text-sm text-slate-500\">Distance</p></div><div className=\"rounded-xl bg-slate-50 p-3\"><p className=\"text-2xl font-black\">{calculateEtaMinutes(km)} min</p><p className=\"text-sm text-slate-500\">ETA</p></div></div><button onClick={onRequest} disabled={requested || ambulance.status==='busy'} className=\"mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:bg-slate-300\">{requested?'Ambulance requested':'Request ambulance'}</button></section>}\n` },
    { path: 'components/AmbulanceTracker.tsx', content: `'use client';\nimport { useEffect,useMemo,useState } from 'react';import AmbulanceDetails from './AmbulanceDetails';import AmbulanceList from './AmbulanceList';import EmergencyActions from './EmergencyActions';import LocationPermissionCard from './LocationPermissionCard';import MapPanel from './MapPanel';import { mockAmbulances } from '@/lib/mockAmbulances';import { sortAmbulancesByDistance } from '@/lib/location';\nexport default function AmbulanceTracker(){const[enabled,setEnabled]=useState(false);const[requested,setRequested]=useState(false);const[tick,setTick]=useState(0);const items=useMemo(()=>sortAmbulancesByDistance(mockAmbulances).map((a,i)=>({...a,updatedAt:tick?String(tick*5+i)+"s ago":a.updatedAt})),[tick]);const[selectedId,setSelectedId]=useState(items[0]?.id||'');const selected=items.find(a=>a.id===selectedId)||items[0];useEffect(()=>{const id=window.setInterval(()=>setTick(t=>t+1),5000);return()=>window.clearInterval(id)},[]);return <main className=\"min-h-screen bg-slate-50\"><section className=\"mx-auto max-w-7xl px-5 py-8\"><div className=\"mb-6 rounded-3xl bg-slate-950 p-6 text-white\"><p className=\"text-blue-200\">FRIENDS emergency prototype</p><h1 className=\"mt-2 text-4xl font-black\">Ambulance live location tracker</h1><p className=\"mt-3 max-w-2xl text-slate-300\">Track nearby mock ambulances, compare ETA, and request the closest available vehicle without a paid map API.</p></div><div className=\"grid gap-5 lg:grid-cols-[1fr_390px]\"><div className=\"space-y-5\"><MapPanel items={items} selectedId={selectedId}/><EmergencyActions/></div><aside className=\"space-y-4\"><LocationPermissionCard enabled={enabled} onEnable={()=>setEnabled(true)}/>{selected?<AmbulanceDetails ambulance={selected} requested={requested} onRequest={()=>setRequested(true)}/>:null}<AmbulanceList items={items} selectedId={selectedId} onSelect={(id)=>{setSelectedId(id);setRequested(false)}}/></aside></div></section></main>}\n` },
    { path: 'app/page.tsx', content: `import AmbulanceTracker from '@/components/AmbulanceTracker';\nexport default function Home(){return <AmbulanceTracker/>}\n` },
    readme('Ambulance Tracker', getTemplateDefinition('ambulance_tracker').requiredFeatures),
  ];
}

function bmiFiles(name: string): ProjectFile[] {
  return [
    ...baseFiles(name, 'BMI Calculator'),
    { path: 'types/bmi.ts', content: `export type BmiCategory='Underweight'|'Healthy'|'Overweight'|'Obese';export interface BmiResult{bmi:number;category:BmiCategory;note:string}\n` },
    { path: 'lib/bmi.ts', content: `import { BmiResult } from '@/types/bmi';export function calculateBmi(heightCm:number,weightKg:number):number{return Math.round((weightKg/((heightCm/100)**2))*10)/10}export function getBmiCategory(bmi:number):BmiResult{if(bmi<18.5)return{bmi,category:'Underweight',note:'Consider discussing nutrition goals with a healthcare professional.'};if(bmi<25)return{bmi,category:'Healthy',note:'Your BMI is in the generally healthy range.'};if(bmi<30)return{bmi,category:'Overweight',note:'Small activity and nutrition changes may help.'};return{bmi,category:'Obese',note:'Consider professional guidance for a safe plan.'}}\n` },
    { path: 'components/BmiCalculator.tsx', content: `'use client';\nimport { useState } from 'react';import { calculateBmi,getBmiCategory } from '@/lib/bmi';\nexport default function BmiCalculator(){const[height,setHeight]=useState('');const[weight,setWeight]=useState('');const[error,setError]=useState('');const[result,setResult]=useState<ReturnType<typeof getBmiCategory>|null>(null);function submit(){const h=Number(height),w=Number(weight);if(!h||!w||h<50||w<10){setError('Enter valid height and weight values.');setResult(null);return}setError('');setResult(getBmiCategory(calculateBmi(h,w)))}return <main className=\"min-h-screen bg-slate-50 px-5 py-10\"><section className=\"mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-soft\"><p className=\"text-sm font-bold text-blue-600\">Health calculator</p><h1 className=\"mt-2 text-4xl font-black\">BMI Calculator</h1><p className=\"mt-3 text-slate-500\">Calculate BMI from height and weight, see category, and reset anytime.</p><div className=\"mt-6 grid gap-4 md:grid-cols-2\"><label className=\"font-semibold\">Height (cm)<input value={height} onChange={e=>setHeight(e.target.value)} type=\"number\" className=\"mt-2 w-full rounded-xl border px-4 py-3\"/></label><label className=\"font-semibold\">Weight (kg)<input value={weight} onChange={e=>setWeight(e.target.value)} type=\"number\" className=\"mt-2 w-full rounded-xl border px-4 py-3\"/></label></div>{error?<p className=\"mt-4 rounded-xl bg-rose-50 p-3 font-semibold text-rose-700\">{error}</p>:null}<div className=\"mt-5 flex gap-3\"><button onClick={submit} className=\"rounded-xl bg-blue-600 px-5 py-3 font-bold text-white\">Calculate BMI</button><button onClick={()=>{setHeight('');setWeight('');setResult(null);setError('')}} className=\"rounded-xl border px-5 py-3 font-bold\">Reset</button></div>{result?<div className=\"mt-6 rounded-2xl bg-slate-950 p-6 text-white\"><p className=\"text-sm text-blue-200\">Your BMI</p><p className=\"text-6xl font-black\">{result.bmi}</p><p className=\"mt-2 text-xl font-bold\">{result.category}</p><p className=\"mt-2 text-slate-300\">{result.note}</p></div>:<div className=\"mt-6 rounded-2xl border border-dashed p-6 text-slate-500\">Enter values to see your BMI result.</div>}</section></main>}\n` },
    { path: 'app/page.tsx', content: `import BmiCalculator from '@/components/BmiCalculator';\nexport default function Home(){return <BmiCalculator/>}\n` },
    readme('BMI Calculator', getTemplateDefinition('bmi_calculator').requiredFeatures),
  ];
}

function genericFiles(name: string, template: ProjectTemplateKey): ProjectFile[] {
  return [
    ...baseFiles(name, template.replace(/_/g, ' ')),
    { path: 'components/AppShell.tsx', content: `'use client';\nimport { useState } from 'react';\nexport default function AppShell(){const[items,setItems]=useState<string[]>(['Domain-specific starter record']);const[query,setQuery]=useState('');return <main className=\"min-h-screen bg-slate-50 px-5 py-10\"><section className=\"mx-auto max-w-5xl\"><div className=\"rounded-3xl bg-slate-950 p-6 text-white\"><h1 className=\"text-4xl font-black\">Functional ${template.replace(/_/g, ' ')}</h1><p className=\"mt-3 text-slate-300\">Interactive app scaffold with state, filtering, empty, loading, and error-ready UI.</p></div><div className=\"mt-5 rounded-2xl bg-white p-5 shadow-soft\"><input value={query} onChange={e=>setQuery(e.target.value)} className=\"w-full rounded-xl border px-4 py-3\" placeholder=\"Filter records\"/><button onClick={()=>setItems([...items,"Record "+(items.length+1)])} className=\"mt-3 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white\">Add domain record</button><ul className=\"mt-4 space-y-2\">{items.filter(i=>i.toLowerCase().includes(query.toLowerCase())).map(i=><li key={i} className=\"rounded-xl bg-slate-50 p-3\">{i}</li>)}</ul></div></section></main>}\n` },
    { path: 'app/page.tsx', content: `import AppShell from '@/components/AppShell';\nexport default function Home(){return <AppShell/>}\n` },
    readme(template.replace(/_/g, ' '), getTemplateDefinition(template).requiredFeatures),
  ];
}

function attendanceFiles(name: string): ProjectFile[] {
  return [
    ...genericFiles(name, 'student_attendance_portal').filter((file) => !['components/AppShell.tsx', 'app/page.tsx', 'README.md'].includes(file.path)),
    { path: 'types/attendance.ts', content: `export interface SubjectAttendance{id:string;code:string;name:string;totalClasses:number;attendedClasses:number}export type AttendanceStatus='safe'|'warning'|'critical'\n` },
    { path: 'lib/attendance.ts', content: `import { SubjectAttendance,AttendanceStatus } from '@/types/attendance';export function calculateAttendancePercentage(a:number,t:number){return t?Math.round(a/t*1000)/10:0}export function getAttendanceStatus(p:number):AttendanceStatus{return p>=75?'safe':p>=65?'warning':'critical'}export function calculateClassesNeededFor75(s:SubjectAttendance){let a=s.attendedClasses,t=s.totalClasses,n=0;while(calculateAttendancePercentage(a,t)<75){a++;t++;n++}return n}\n` },
    { path: 'lib/mockData.ts', content: `import { SubjectAttendance } from '@/types/attendance';export const subjects:SubjectAttendance[]=[{id:'dbms',code:'CS301',name:'Database Systems',totalClasses:42,attendedClasses:36},{id:'os',code:'CS302',name:'Operating Systems',totalClasses:40,attendedClasses:29},{id:'cn',code:'CS303',name:'Computer Networks',totalClasses:38,attendedClasses:24},{id:'ai',code:'CS304',name:'Artificial Intelligence',totalClasses:34,attendedClasses:28}];\n` },
    { path: 'components/AttendanceStatusBadge.tsx', content: `import { AttendanceStatus } from '@/types/attendance';const s:Record<AttendanceStatus,string>={safe:'bg-emerald-100 text-emerald-700',warning:'bg-amber-100 text-amber-700',critical:'bg-rose-100 text-rose-700'};export default function AttendanceStatusBadge({status}:{status:AttendanceStatus}){return <span className={\`rounded-full px-3 py-1 text-xs font-bold \${s[status]}\`}>{status}</span>}\n` },
    { path: 'components/AttendanceCalculator.tsx', content: `import { calculateClassesNeededFor75 } from '@/lib/attendance';import { SubjectAttendance } from '@/types/attendance';export default function AttendanceCalculator({subject}:{subject:SubjectAttendance}){const n=calculateClassesNeededFor75(subject);return <p className=\"text-sm font-semibold\">{n===0?'Above 75% minimum':"Attend next "+n+" classes to reach 75%"}</p>}\n` },
    { path: 'components/SubjectAttendanceCard.tsx', content: `import { calculateAttendancePercentage,getAttendanceStatus } from '@/lib/attendance';import { SubjectAttendance } from '@/types/attendance';import AttendanceCalculator from './AttendanceCalculator';import AttendanceStatusBadge from './AttendanceStatusBadge';export default function SubjectAttendanceCard({subject}:{subject:SubjectAttendance}){const p=calculateAttendancePercentage(subject.attendedClasses,subject.totalClasses),status=getAttendanceStatus(p);return <article className=\"rounded-2xl bg-white p-5 shadow-soft\"><div className=\"flex justify-between\"><div><p className=\"text-xs font-bold text-slate-400\">{subject.code}</p><h3 className=\"font-black\">{subject.name}</h3></div><AttendanceStatusBadge status={status}/></div><div className=\"mt-4 h-3 rounded-full bg-slate-100\"><div className=\"h-full rounded-full bg-blue-600\" style={{width:String(p)+"%"}}/></div><p className=\"mt-2 font-bold\">{p}% - {subject.attendedClasses}/{subject.totalClasses}</p><AttendanceCalculator subject={subject}/></article>}\n` },
    { path: 'components/AttendanceSummaryCards.tsx', content: `import { calculateAttendancePercentage } from '@/lib/attendance';import { SubjectAttendance } from '@/types/attendance';export default function AttendanceSummaryCards({subjects}:{subjects:SubjectAttendance[]}){const total=subjects.reduce((s,x)=>s+x.totalClasses,0),att=subjects.reduce((s,x)=>s+x.attendedClasses,0),pct=calculateAttendancePercentage(att,total);return <section className=\"grid gap-4 sm:grid-cols-3\"><div className=\"rounded-2xl bg-white p-5 shadow-soft\"><p>Overall</p><b className=\"text-3xl\">{pct}%</b></div><div className=\"rounded-2xl bg-white p-5 shadow-soft\"><p>Attended</p><b className=\"text-3xl\">{att}</b></div><div className=\"rounded-2xl bg-white p-5 shadow-soft\"><p>Total</p><b className=\"text-3xl\">{total}</b></div></section>}\n` },
    { path: 'components/AttendanceTable.tsx', content: `import { SubjectAttendance } from '@/types/attendance';import { calculateAttendancePercentage,getAttendanceStatus } from '@/lib/attendance';import AttendanceStatusBadge from './AttendanceStatusBadge';export default function AttendanceTable({subjects}:{subjects:SubjectAttendance[]}){return <table className=\"w-full rounded-2xl bg-white shadow-soft\"><tbody>{subjects.map(s=><tr key={s.id} className=\"border-b\"><td className=\"p-4 font-bold\">{s.name}</td><td className=\"p-4\">{calculateAttendancePercentage(s.attendedClasses,s.totalClasses)}%</td><td className=\"p-4\"><AttendanceStatusBadge status={getAttendanceStatus(calculateAttendancePercentage(s.attendedClasses,s.totalClasses))}/></td></tr>)}</tbody></table>}\n` },
    { path: 'components/StudentDashboard.tsx', content: `'use client';import { useMemo,useState } from 'react';import { subjects } from '@/lib/mockData';import AttendanceSummaryCards from './AttendanceSummaryCards';import AttendanceTable from './AttendanceTable';import SubjectAttendanceCard from './SubjectAttendanceCard';export default function StudentDashboard(){const[q,setQ]=useState('');const filtered=useMemo(()=>subjects.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.code.toLowerCase().includes(q.toLowerCase())),[q]);return <main className=\"min-h-screen bg-slate-50 px-5 py-8\"><section className=\"mx-auto max-w-7xl\"><div className=\"rounded-3xl bg-slate-950 p-6 text-white\"><h1 className=\"text-4xl font-black\">Student Attendance Portal</h1><p className=\"mt-2 text-slate-300\">Check subject-wise attendance, warnings, and classes needed for 75%.</p></div><div className=\"my-5\"><AttendanceSummaryCards subjects={subjects}/></div><input aria-label=\"Search subjects\" value={q} onChange={e=>setQ(e.target.value)} placeholder=\"Search subjects\" className=\"mb-5 w-full rounded-xl border px-4 py-3\"/>{filtered.length===0?<div className=\"rounded-2xl border border-dashed p-8\">No subjects found.</div>:<><div className=\"mb-5 grid gap-4 md:grid-cols-2\">{filtered.map(s=><SubjectAttendanceCard key={s.id} subject={s}/>)}</div><AttendanceTable subjects={filtered}/></>}</section></main>}\n` },
    { path: 'app/page.tsx', content: `import StudentDashboard from '@/components/StudentDashboard';export default function Home(){return <StudentDashboard/>}\n` },
    { path: 'components/EmptyState.tsx', content: `export default function EmptyState(){return <div className=\"rounded-2xl border border-dashed p-8 text-center\">No matching subjects.</div>}\n` },
    readme('Student Attendance Portal', getTemplateDefinition('student_attendance_portal').requiredFeatures),
  ];
}

function expenseFiles(name: string): ProjectFile[] {
  return genericFiles(name, 'expense_tracker');
}

function pdfFiles(name: string): ProjectFile[] {
  return [
    ...baseFiles(name, 'PDF to Notes Converter', { 'pdf-parse': '^2.4.5', '@google/generative-ai': '^0.24.1' }),
    { path: 'types/notes.ts', content: `export type Provider='gemini'|'mock';export interface NotesResult{documentTitle:string;provider:Provider;summary:string;keyPoints:string[];importantSections:string[];definitions:string[];examQuestions:string[];revisionActions:string[];sourcePreview:string;wordCount:number;pageEstimate:number}\n` },
    { path: 'lib/formatNotes.ts', content: `import { NotesResult } from '@/types/notes';export function cleanExtractedText(t:string){return t.replace(/\\u0000/g,'').replace(/[ \\t]+\\n/g,'\\n').replace(/\\n{3,}/g,'\\n\\n').replace(/[ \\t]{2,}/g,' ').trim()}export function formatNotesAsMarkdown(r:NotesResult){return \`# \${r.documentTitle}\\n\\nGenerated using: \${r.provider}\\n\\n## Summary\\n\${r.summary}\\n\\n## Key Points\\n\${r.keyPoints.map(x=>'- '+x).join('\\n')}\\n\\n## Important Sections\\n\${r.importantSections.map(x=>'- '+x).join('\\n')}\\n\\n## Questions\\n\${r.examQuestions.map(x=>'- '+x).join('\\n')}\\n\`}\n` },
    { path: 'lib/notes.ts', content: `import { NotesResult } from '@/types/notes';export function generateMockNotes(text:string,fileName:string,wordCount:number,pageEstimate:number):NotesResult{const lines=text.split('\\n').map(l=>l.trim()).filter(Boolean);const title=lines.find(l=>l.length<100)||fileName.replace(/\\.pdf$/,'');const lower=text.toLowerCase();const sections=['requirements','pages','ui structure','tech stack','frontend plan','backend/api plan','deployment steps','next steps'].filter(s=>lower.includes(s.split('/')[0]));return{documentTitle:title,provider:'mock',summary:\`This document is about \${title}. It covers \${sections.length?sections.join(', '):'the main topics found in the extracted PDF text'}.\`,keyPoints:lines.slice(1,8),importantSections:sections.length?sections:lines.slice(0,6),definitions:[],examQuestions:(sections.length?sections:lines.slice(0,4)).map(s=>\`What does the PDF say about \${s}?\`),revisionActions:['Review each important section','Turn key points into flashcards','Compare implementation and deployment notes'],sourcePreview:text.slice(0,1200),wordCount,pageEstimate}}\n` },
    { path: 'lib/pdf.ts', content: `import path from 'node:path';import { PDFParse } from 'pdf-parse';import { cleanExtractedText } from './formatNotes';PDFParse.setWorker(path.join(process.cwd(),'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'));export async function extractPdfText(buffer:Buffer){const parser=new PDFParse({data:buffer});try{const r=await parser.getText();return cleanExtractedText(r.text||'')}finally{await parser.destroy()}}\n` },
    { path: 'app/api/generate-notes/route.ts', content: `import { NextResponse } from 'next/server';import { extractPdfText } from '@/lib/pdf';import { generateMockNotes } from '@/lib/notes';export const runtime='nodejs';const MAX=10*1024*1024;export async function POST(req:Request){const form=await req.formData();const file=form.get('file');if(!(file instanceof File))return NextResponse.json({error:'No PDF file was uploaded.'},{status:400});if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf'))return NextResponse.json({error:'Only PDF files are accepted.'},{status:400});if(file.size>MAX)return NextResponse.json({error:'File is too large. Please upload a PDF under 10MB.'},{status:400});let text='';try{text=await extractPdfText(Buffer.from(await file.arrayBuffer()))}catch(e:any){return NextResponse.json({error:'PDF text extraction failed.',details:e.message},{status:422})}if(text.length<100)return NextResponse.json({error:'This PDF may be scanned or image-based. Text extraction could not read enough content. OCR support can be added in a future version.'},{status:422});const words=text.match(/\\S+/g)||[];return NextResponse.json(generateMockNotes(text,file.name,words.length,Math.max(1,Math.ceil(words.length/450))))}\n` },
    { path: 'components/PDFUploader.tsx', content: `'use client';export default function PDFUploader({onFile}:{onFile:(f:File)=>void}){return <label className=\"block cursor-pointer rounded-2xl border border-dashed bg-white p-8 text-center shadow-soft\"><b>Upload PDF</b><p className=\"text-sm text-slate-500\">Text-based PDF under 10MB</p><input className=\"sr-only\" type=\"file\" accept=\"application/pdf,.pdf\" onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f)}}/></label>}\n` },
    { path: 'components/ProcessingStatus.tsx', content: `export default function ProcessingStatus({loading}:{loading:boolean}){return loading?<div className=\"rounded-2xl bg-blue-50 p-4 font-semibold text-blue-700\">Uploading PDF -> Extracting text -> Generating notes...</div>:null}\n` },
    { path: 'components/FilePreviewCard.tsx', content: `export default function FilePreviewCard({file}:{file:File}){return <div className=\"rounded-2xl bg-white p-4 shadow-soft\"><b>{file.name}</b><p className=\"text-sm text-slate-500\">{Math.round(file.size/1024)} KB selected</p></div>}\n` },
    { path: 'components/NotesOutput.tsx', content: `'use client';import { NotesResult } from '@/types/notes';import { formatNotesAsMarkdown } from '@/lib/formatNotes';export default function NotesOutput({notes,fileName}:{notes:NotesResult;fileName:string}){const md=formatNotesAsMarkdown(notes);function dl(){const u=URL.createObjectURL(new Blob([md],{type:'text/markdown'}));const a=document.createElement('a');a.href=u;a.download=\`notes-\${fileName.replace(/\\.pdf$/,'')}.md\`;a.click();URL.revokeObjectURL(u)}return <section className=\"space-y-4 rounded-2xl bg-white p-5 shadow-soft\"><span className=\"rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700\">Generated using {notes.provider}</span><h2 className=\"text-2xl font-black\">{notes.documentTitle}</h2><p>{notes.summary}</p><button onClick={()=>navigator.clipboard.writeText(md)} className=\"rounded-xl border px-4 py-2 font-bold\">Copy</button><button onClick={dl} className=\"ml-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white\">Download Markdown</button>{['keyPoints','importantSections','definitions','examQuestions','revisionActions'].map(k=><div key={k} className=\"rounded-xl bg-slate-50 p-4\"><h3 className=\"font-bold\">{k}</h3><ul>{(notes as any)[k].map((x:string)=><li key={x}>- {x}</li>)}</ul></div>)}<details><summary>Source Preview</summary><pre className=\"whitespace-pre-wrap\">{notes.sourcePreview}</pre></details></section>}\n` },
    { path: 'app/page.tsx', content: `'use client';import { useState } from 'react';import PDFUploader from '@/components/PDFUploader';import NotesOutput from '@/components/NotesOutput';import ProcessingStatus from '@/components/ProcessingStatus';import FilePreviewCard from '@/components/FilePreviewCard';import { NotesResult } from '@/types/notes';export default function Home(){const[file,setFile]=useState<File|null>(null),[notes,setNotes]=useState<NotesResult|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');async function gen(){if(!file){setError('No file selected.');return}setLoading(true);setError('');const fd=new FormData();fd.append('file',file);const res=await fetch('/api/generate-notes',{method:'POST',body:fd});const json=await res.json();setLoading(false);if(!res.ok){setError(json.error);return}setNotes(json)}return <main className=\"min-h-screen bg-slate-50 px-5 py-8\"><section className=\"mx-auto grid max-w-6xl gap-5 lg:grid-cols-[360px_1fr]\"><div className=\"space-y-4\"><h1 className=\"text-4xl font-black\">PDF to Notes Converter</h1><PDFUploader onFile={f=>{setFile(f);setNotes(null);setError('')}}/>{file?<FilePreviewCard file={file}/>:null}<button disabled={!file||loading} onClick={gen} className=\"w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:bg-slate-300\">Generate Notes</button><ProcessingStatus loading={loading}/>{error?<div className=\"rounded-xl bg-rose-50 p-4 font-semibold text-rose-700\">{error}</div>:null}</div>{notes&&file?<NotesOutput notes={notes} fileName={file.name}/>:<div className=\"rounded-2xl border border-dashed bg-white p-8 text-center\">Upload a PDF to begin.</div>}</section></main>}\n` },
    readme('PDF to Notes Converter', getTemplateDefinition('pdf_to_notes_converter').requiredFeatures, '\n## Environment\n\n`GEMINI_API_KEY` can be added later. Mock mode still uses extracted PDF text.\n'),
  ];
}

export function generateTemplateFiles(plan: FilePlan): ProjectFile[] {
  if (plan.selectedTemplate === 'ambulance_tracker') return ambulanceTrackerFiles(plan.projectName);
  if (plan.selectedTemplate === 'pdf_to_notes_converter') return pdfFiles(plan.projectName);
  if (plan.selectedTemplate === 'student_attendance_portal') return attendanceFiles(plan.projectName);
  if (plan.selectedTemplate === 'bmi_calculator') return bmiFiles(plan.projectName);
  if (plan.selectedTemplate === 'expense_tracker') return expenseFiles(plan.projectName);
  return genericFiles(plan.projectName, plan.selectedTemplate);
}

export function repairGeneratedProject(plan: FilePlan, files: ProjectFile[]): ProjectFile[] {
  const generated = generateTemplateFiles(plan);
  const map = new Map(files.map((file) => [file.path, file]));
  for (const file of generated) {
    if (!map.has(file.path) || !map.get(file.path)?.content.trim()) map.set(file.path, file);
  }
  return Array.from(map.values());
}

function getFile(files: ProjectFile[], path: string): ProjectFile | undefined {
  return files.find((file) => file.path === path);
}

export function validateGeneratedProject(plan: FilePlan, files: ProjectFile[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const paths = new Set(files.map((file) => file.path));
  const joined = files.map((file) => file.content).join('\n').toLowerCase();
  const definition = getTemplateDefinition(plan.selectedTemplate);

  for (const file of allBaseFiles) if (!paths.has(file)) errors.push(`${file} is missing`);
  for (const file of definition.requiredFiles) if (!paths.has(file)) errors.push(`${file} is missing`);
  if (plan.projectType !== 'landing_page' && files.filter((file) => /\.(tsx|ts|css)$/.test(file.path)).length < 8) errors.push('Functional apps must include at least 8 meaningful source files');
  if (!getFile(files, 'package.json')?.content.includes('"dev"')) errors.push('package.json scripts must include dev/build/start');
  if (!getFile(files, 'README.md')?.content.toLowerCase().includes('npm install')) errors.push('README must include setup instructions');
  for (const forbidden of definition.forbiddenPatterns) if (joined.includes(forbidden.toLowerCase())) errors.push(`Forbidden pattern found: ${forbidden}`);
  for (const logic of definition.requiredLogic) if (!joined.includes(logic.toLowerCase().replace(/\(\)/g, ''))) warnings.push(`Check domain logic: ${logic}`);
  if (plan.selectedTemplate !== 'startup_landing_page' && joined.includes('testimonial')) errors.push('Unrequested testimonial/marketing content found');

  const base = errors.length ? 6 : 9;
  const score: QualityScore = {
    requirementMatch: Math.max(0, base - Math.min(errors.length, 4)),
    functionality: Math.max(0, base - Math.min(errors.length, 4)),
    uiUxQuality: warnings.length > 4 ? 7 : 8,
    codeQuality: errors.length ? 7 : 8,
    runnability: errors.length ? 6 : 9,
    accessibility: warnings.length > 5 ? 7 : 8,
    readmeQuality: getFile(files, 'README.md') ? 8 : 0,
    overallScore: 0,
    issues: errors,
    improvementSuggestions: warnings,
  };
  score.overallScore = Math.round(((score.requirementMatch + score.functionality + score.uiUxQuality + score.codeQuality + score.runnability + score.accessibility + score.readmeQuality) / 7) * 10) / 10;

  return { passed: errors.length === 0 && score.overallScore >= 8, errors, warnings, score };
}

export function renderProjectFileMap(plan: FilePlan, files: ProjectFile[], validation: ValidationResult): string {
  return JSON.stringify({
    projectName: plan.projectName,
    projectSlug: plan.projectName,
    projectType: plan.projectType,
    templateId: plan.selectedTemplate,
    files: files.map((file) => ({ path: file.path, content: file.content, purpose: file.purpose || 'Generated source file' })),
    setupCommands: ['npm install'],
    runCommands: ['npm run dev'],
    notes: ['Generated by staged FRIENDS pipeline', `Quality score: ${validation.score.overallScore}`],
    validation,
  }, null, 2);
}
