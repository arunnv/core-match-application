/** Static seed data used in server components when DB is not yet connected */

export const SEED_JOBS = [
  {
    id: 'j1',
    code: 'JC#00102',
    title: 'ServiceNow BCM TCP / Calypso Developer',
    location: 'Remote',
    experience: '5–6 Yrs Exp',
    status: 'Active' as const,
    scored: 42,
    processing: 8,
  },
  {
    id: 'j2',
    code: 'JC#00103',
    title: 'Senior UX Architect (Enterprise Systems)',
    location: 'Kochi, IN',
    experience: 'Hybrid',
    status: 'Active' as const,
    scored: 19,
    processing: 0,
  },
  {
    id: 'j3',
    code: 'JC#00104',
    title: 'Principal Site Reliability Engineer',
    location: 'Bangalore, IN',
    experience: 'On-Site',
    status: 'Archived' as const,
    scored: 61,
    processing: 0,
  },
];

export const SEED_COMPETENCIES = [
  { id: 'cp1', name: 'React / Frontend', level: 'CORE', weight: 34 },
  { id: 'cp2', name: 'System Design', level: 'CORE', weight: 24 },
  { id: 'cp3', name: 'TypeScript', level: 'IMPORTANT', weight: 18 },
  { id: 'cp4', name: 'Testing & QA', level: 'IMPORTANT', weight: 14 },
  { id: 'cp5', name: 'Communication', level: 'SUPPORTING', weight: 10 },
];

export const SEED_CANDIDATES = [
  {
    id: 'c1',
    name: 'Maya Okafor',
    currentRole: 'Senior Frontend Engineer',
    location: 'Berlin, DE',
    experience: '9 yrs',
    score: 94,
    status: 'scored' as const,
    tags: ['React', 'Design Systems', 'TypeScript'],
    aiHead: 'Platform-grade frontend ownership with deep design-system DNA.',
    aiReasoning: [
      'Maya maps directly onto the React / Frontend core. She owned a federated component platform consumed by 40+ product teams, which is the strongest signal in the pool for the 34% core weight.',
      'Evidence of architectural leadership and mentorship lifts the System Design and Communication competencies above threshold. The only soft spot is automated end-to-end coverage.',
    ],
    capabilities: [
      { label: 'React / Frontend', note: '9 yrs, expert. Led design-system platform.', w: 34 },
      { label: 'System Design', note: 'Federated micro-frontend architecture.', w: 24 },
      { label: 'TypeScript', note: 'Strict-mode codebases, type-level APIs.', w: 18 },
      { label: 'Communication', note: 'Conference speaker, RFC author.', w: 10 },
    ],
    gaps: [{ label: 'Testing & QA', note: 'Unit coverage present; limited E2E ownership.', w: 14 }],
  },
  {
    id: 'c2',
    name: 'Daniel Reyes',
    currentRole: 'Frontend Engineer',
    location: 'Lisbon, PT',
    experience: '6 yrs',
    score: 88,
    status: 'scored' as const,
    tags: ['React', 'GraphQL', 'Testing'],
    aiHead: 'Product-focused engineer with the strongest testing signal in the pool.',
    aiReasoning: [
      'Daniel clears every core competency and is the only finalist with sustained ownership of an E2E testing pipeline, fully covering the 14% Testing weight.',
      'System-design evidence is solid but scoped to feature-level rather than platform architecture, capping the overall slightly below the top profile.',
    ],
    capabilities: [
      { label: 'React / Frontend', note: '6 yrs, advanced. Shipped 3 consumer apps.', w: 34 },
      { label: 'Testing & QA', note: 'Built Playwright E2E suite, 80%+ coverage.', w: 14 },
      { label: 'TypeScript', note: 'Daily driver across all repos.', w: 18 },
    ],
    gaps: [
      { label: 'System Design', note: 'Feature-scoped; less platform architecture.', w: 24 },
      { label: 'Communication', note: 'Limited public / cross-org evidence.', w: 10 },
    ],
  },
  {
    id: 'c3',
    name: 'Priya Nair',
    currentRole: 'Full-stack Engineer',
    location: 'Bengaluru, IN',
    experience: '7 yrs',
    score: 81,
    status: 'scored' as const,
    tags: ['React', 'Node', 'System Design'],
    aiHead: 'Breadth across the stack; frontend depth slightly under the bar.',
    aiReasoning: [
      'Priya brings excellent System Design signal from owning service architecture, comfortably covering the 24% weight.',
      'Frontend work is real but shares time with backend, so the dominant React core is only partially satisfied — the main driver of the gap to the top tier.',
    ],
    capabilities: [
      { label: 'System Design', note: 'Owned multi-service backend architecture.', w: 24 },
      { label: 'TypeScript', note: 'Full-stack TS, Node + React.', w: 18 },
      { label: 'Communication', note: 'Tech lead for a 6-person squad.', w: 10 },
    ],
    gaps: [
      { label: 'React / Frontend', note: 'Split focus; less deep FE specialization.', w: 34 },
      { label: 'Testing & QA', note: 'Integration tests only.', w: 14 },
    ],
  },
  { id: 'c4', name: '', currentRole: '', location: '', experience: '', score: 0, status: 'processing' as const, tags: [], aiHead: '', aiReasoning: [], capabilities: [], gaps: [] },
  {
    id: 'c5',
    name: 'Liang Wei',
    currentRole: 'UI Engineer',
    location: 'Singapore, SG',
    experience: '5 yrs',
    score: 72,
    status: 'scored' as const,
    tags: ['React', 'Animation', 'CSS'],
    aiHead: 'Exceptional craft and motion; lighter on architecture and types.',
    aiReasoning: [
      'Liang has outstanding UI craft — animation, accessibility and CSS architecture are top of the pool, lifting the React / Frontend core.',
      'TypeScript and System Design evidence is thinner, and there is little testing signal, which together hold the overall in the review band.',
    ],
    capabilities: [
      { label: 'React / Frontend', note: 'Pixel-grade UI, motion specialist.', w: 34 },
      { label: 'Communication', note: 'Strong design-eng collaboration.', w: 10 },
    ],
    gaps: [
      { label: 'TypeScript', note: 'Mostly JS; TS in progress.', w: 18 },
      { label: 'System Design', note: 'Component-level; little platform scope.', w: 24 },
      { label: 'Testing & QA', note: 'No automated coverage cited.', w: 14 },
    ],
  },
  { id: 'c6', name: '', currentRole: '', location: '', experience: '', score: 0, status: 'processing' as const, tags: [], aiHead: '', aiReasoning: [], capabilities: [], gaps: [] },
];

export const SEED_TENANTS = [
  { id: 't1', company: 'IBM Kochi', roles: 14, users: 28, region: 'ap-south-1 (Mumbai)', status: 'Active' },
  { id: 't2', company: 'Applied Systems', roles: 3, users: 5, region: 'us-east-1', status: 'Active' },
  { id: 't3', company: 'Accenture Delhi', roles: 8, users: 19, region: 'ap-south-1 (Mumbai)', status: 'Active' },
  { id: 't4', company: 'TCS Bangalore', roles: 21, users: 44, region: 'ap-south-1 (Mumbai)', status: 'Active' },
  { id: 't5', company: 'Capgemini Paris', roles: 6, users: 12, region: 'eu-west-1', status: 'Active' },
];

export const SEED_USERS = [
  { id: 'u1', name: 'Maya Okafor', role: 'Recruitment Lead', lastLogin: '2m ago', credits: 8420, enabled: true },
  { id: 'u2', name: 'Priya Sharma', role: 'Hiring Manager', lastLogin: '14m ago', credits: 5680, enabled: true },
  { id: 'u3', name: 'James Wilson', role: 'System Admin', lastLogin: '1h ago', credits: 3450, enabled: true },
  { id: 'u4', name: 'Sofia Mendez', role: 'Talent Scout', lastLogin: '8h ago', credits: 2100, enabled: true },
  { id: 'u5', name: 'Chen Liu', role: 'HR Manager', lastLogin: '2d ago', credits: 1200, enabled: false },
];
