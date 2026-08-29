import { ProjectItem, AdSlide } from '../types';

export const INITIAL_PROJECTS: ProjectItem[] = [];

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

