export type NavView =
  | 'home'
  | 'projects'
  | 'profile'
  | 'project'
  | 'note'
  | 'trash'
  | 'backup'
  | 'aknotes'
  | 'admin'
  | 'feedback'
  | 'auth'
  | 'new-project'
  | 'secret-prompt'
  | 'install'
  | 'profile-sheet'
  | 'profile-edit';

export interface AppNavState {
  notebro: true;
  view: NavView;
  tab?: 'home' | 'projects' | 'profile';
  projectId?: string;
  noteId?: string;
  isNewNote?: boolean;
  noteInitialType?: 'text' | 'checklist' | 'sketch';
  fromProjectId?: string;
  sheet?: 'appearance' | 'notifications' | 'storage' | 'sync';
  timestamp?: number;
}

/**
 * Initializes the root SPA history state on startup.
 * Uses replaceState so that the initial Home view represents the stack base
 * without creating spurious duplicate history entries.
 */
export function initHistoryState(): AppNavState {
  if (typeof window === 'undefined') {
    return { notebro: true, view: 'home', tab: 'home' };
  }

  const existing = window.history.state as AppNavState | null;
  if (existing && existing.notebro && existing.view) {
    return existing;
  }

  const rootState: AppNavState = {
    notebro: true,
    view: 'home',
    tab: 'home',
    timestamp: Date.now(),
  };

  try {
    window.history.replaceState(rootState, '', window.location.pathname + window.location.search);
  } catch (e) {
    console.warn('Could not initialize navigation history state', e);
  }

  return rootState;
}

/**
 * Pushes a new SPA navigation state to browser history stack.
 * Prevents consecutive duplicates of the same view state.
 */
export function pushNavState(state: Omit<AppNavState, 'notebro' | 'timestamp'>): AppNavState {
  const fullState: AppNavState = {
    ...state,
    notebro: true,
    timestamp: Date.now(),
  };

  if (typeof window === 'undefined') return fullState;

  const current = window.history.state as AppNavState | null;
  // If target state is identical to current active state, avoid duplicate stack push
  if (
    current &&
    current.notebro &&
    current.view === fullState.view &&
    current.tab === fullState.tab &&
    current.projectId === fullState.projectId &&
    current.noteId === fullState.noteId &&
    current.isNewNote === fullState.isNewNote &&
    current.sheet === fullState.sheet
  ) {
    return fullState;
  }

  try {
    const hash = fullState.view === 'home' ? '' : `#${fullState.view}`;
    window.history.pushState(fullState, '', hash || window.location.pathname + window.location.search);
  } catch (e) {
    console.warn('Failed to push navigation state', e);
  }

  return fullState;
}

/**
 * Safely navigates backwards in browser history.
 * If no previous in-app history entry exists, triggers the optional fallback.
 */
export function popNav(fallback?: () => void) {
  if (typeof window !== 'undefined' && window.history.length > 1 && window.history.state?.notebro) {
    window.history.back();
  } else if (fallback) {
    fallback();
  }
}
