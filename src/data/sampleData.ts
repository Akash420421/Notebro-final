import { ProjectItem, AdSlide } from '../types';

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-build-1',
    title: 'SaaS Analytics Platform V2',
    subtitle: 'Full-Stack Web & Mobile App',
    description: 'Next-gen analytics dashboard with real-time user session tracking, AI insights, and Stripe billing integration.',
    mode: 'developer',
    createdAt: 'Yesterday, 4:15 PM',
    updatedAt: '10 mins ago',
    tags: ['React', 'FullStack', 'V2', 'Stripe'],
    isPinned: true,
    color: '#eef2ff',
    coverGradient: 'from-indigo-500/20 to-blue-500/20',
    developerData: {
      language: 'typescript',
      repoUrl: 'https://github.com/example/analytics-v2',
      codeSnippet: `// SaaS Analytics API Stream
export async function trackEvent(eventType: string, payload: Record<string, any>) {
  return fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, payload, timestamp: Date.now() })
  });
}`,
      apiEndpoints: [
        { id: 'ep-1', method: 'POST', endpoint: '/api/analytics/track', description: 'Stream incoming client analytics event' },
        { id: 'ep-2', method: 'GET', endpoint: '/api/analytics/metrics', description: 'Fetch aggregated real-time dashboard metrics' },
      ],
      techNotes: 'Sub-50ms ingestion pipeline with Redis stream buffer.',
    },
  },
  {
    id: 'proj-student-1',
    title: 'Organic Chemistry & Thermodynamics',
    subtitle: 'Mid-term revision, formulas & flashcards',
    description: 'Comprehensive study notes on reaction mechanisms, Gibbs free energy, enthalpy, and reaction equilibrium constants.',
    mode: 'student',
    createdAt: '3 days ago',
    updatedAt: '2 hours ago',
    tags: ['Chemistry', 'Physics', 'Exams', 'Formulas'],
    isPinned: true,
    color: '#f0fdf4',
    coverGradient: 'from-emerald-500/20 to-teal-500/20',
    studentData: {
      subject: 'Physical Chemistry 201',
      studyStreak: 7,
      chapters: [
        { id: 'ch-1', title: 'Chapter 4: First & Second Laws of Thermodynamics', notes: 'First law: Conservation of energy (ΔU = q + w). Second law: Entropy of an isolated system always increases (ΔS ≥ 0).', completed: true },
        { id: 'ch-2', title: 'Chapter 5: Gibbs Free Energy & Spontaneity', notes: 'ΔG = ΔH - TΔS. If ΔG < 0, reaction is spontaneous. Standard cell potential: ΔG° = -nFE°.', completed: true },
        { id: 'ch-3', title: 'Chapter 6: Reaction Kinetics & Arrhenius Equation', notes: 'k = A * e^(-Ea / RT). Half-life for first order: t1/2 = 0.693 / k.', completed: false },
      ],
      keyPoints: [
        'Gibbs Free Energy: ΔG = ΔH - TΔS',
        'Arrhenius Equation: k = A * exp(-Ea/RT)',
        'Carnot Engine Efficiency: η = 1 - (Tc/Th)',
        'Henderson-Hasselbalch Equation: pH = pKa + log([A-]/[HA])',
      ],
      flashcards: [
        { id: 'fc-1', question: 'What is the condition for a process to be spontaneous at constant T and P?', answer: 'The change in Gibbs Free Energy must be negative (ΔG < 0).', mastered: true },
        { id: 'fc-2', question: 'State the First Law of Thermodynamics.', answer: 'Energy cannot be created or destroyed; the internal energy change equals heat plus work (ΔU = q + w).', mastered: false },
        { id: 'fc-3', question: 'What does the Arrhenius pre-exponential factor A represent?', answer: 'The frequency of collisions and probability of correct steric orientation.', mastered: true },
      ],
      weakTopics: [
        { id: 'wt-1', topic: 'SN1 vs SN2 Carbocation Stability & Stereochemistry', confidence: 2 },
        { id: 'wt-2', topic: 'Derivation of Maxwell Relations from Thermodynamic Potentials', confidence: 3 },
      ],
    },
  },
  {
    id: 'proj-dev-1',
    title: 'Auth & JWT Token Service',
    subtitle: 'Node.js, Redis & OAuth2 Gateway',
    description: 'Scalable authentication microservice with refresh token rotation, rate-limiting Redis middleware, and Google OAuth2 integration.',
    mode: 'developer',
    createdAt: 'May 14, 2026',
    updatedAt: 'Yesterday',
    tags: ['Node.js', 'TypeScript', 'Auth', 'Redis'],
    isPinned: false,
    color: '#eef2ff',
    coverGradient: 'from-indigo-500/20 to-blue-500/20',
    developerData: {
      language: 'typescript',
      repoUrl: 'https://github.com/example/auth-gateway-service',
      codeSnippet: `import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Secure JWT Authentication & Token Rotation Middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token expired or invalid signature' });
  }
};`,
      apiEndpoints: [
        { id: 'ep-1', method: 'POST', endpoint: '/api/v1/auth/login', description: 'Authenticate user credentials & issue tokens' },
        { id: 'ep-2', method: 'POST', endpoint: '/api/v1/auth/refresh', description: 'Exchange valid refresh token for new access token' },
        { id: 'ep-3', method: 'GET', endpoint: '/api/v1/user/profile', description: 'Fetch authenticated user profile and permissions' },
        { id: 'ep-4', method: 'DELETE', endpoint: '/api/v1/auth/logout', description: 'Revoke active refresh token in Redis' },
      ],
      techNotes: 'Uses RSA-256 asymmetric signing keys stored in Vault. Redis cluster handles distributed token revocation blocklists.',
    },
  },
  {
    id: 'proj-normal-1',
    title: 'Daily Meeting & Sprint Standup',
    subtitle: 'Morning priorities & team sync',
    description: 'Key takeaways from the weekly sync with the engineering lead, client deliverable deadlines, and design token updates.',
    mode: 'normal',
    createdAt: 'Yesterday, 10:30 AM',
    updatedAt: '2 hours ago',
    tags: ['Work', 'Standup', 'Sprint'],
    isPinned: false,
    color: '#ffffff',
    coverGradient: 'from-neutral-400/20 to-stone-400/20',
  },
  {
    id: 'proj-build-2',
    title: 'Mobile PWA Offline Synchronizer',
    subtitle: 'IndexedDB & Service Worker Engine',
    description: 'Architecture and implementation for background conflict resolution and local storage syncing for mobile devices.',
    mode: 'developer',
    createdAt: 'May 10, 2026',
    updatedAt: '4 days ago',
    tags: ['PWA', 'Offline', 'Mobile'],
    isPinned: false,
    color: '#eef2ff',
    coverGradient: 'from-indigo-500/20 to-blue-500/20',
    developerData: {
      language: 'typescript',
      repoUrl: 'https://github.com/example/pwa-sync',
      codeSnippet: `// ServiceWorker sync registration
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncPendingNotes());
  }
});`,
      apiEndpoints: [
        { id: 'ep-sync', method: 'POST', endpoint: '/api/sync/batch', description: 'Process offline queued transactions' },
      ],
      techNotes: 'IndexedDB wrapper with exponential backoff retry queue.',
    },
  },
];

export const ADS_SLIDES: AdSlide[] = [
  {
    id: 'ad-1',
    tag: 'PRO TIPS',
    title: 'Ads',
    description: 'Boost your productivity with ProjectNotes Pro. Multi-device sync, unlimited projects, and AI summaries.',
    accent: 'bg-neutral-900 text-white',
    ctaText: 'Explore Pro Features',
    linkUrl: '#',
  },
  {
    id: 'ad-2',
    tag: 'STUDENT TOOLS',
    title: 'Ads',
    description: 'Turn your notes into active recall flashcards with spaced repetition algorithms built for exam success.',
    accent: 'bg-emerald-900 text-white',
    ctaText: 'Open Student Mod',
    linkUrl: '#',
  },
  {
    id: 'ad-3',
    tag: 'BUILDER KIT',
    title: 'Ads',
    description: 'Track roadmaps, kanban sprints, bug reports, and launch checklists all in one single minimal workspace.',
    accent: 'bg-amber-900 text-white',
    ctaText: 'Explore Build Mod',
    linkUrl: '#',
  },
];

