export type AppMode = 'normal' | 'student' | 'developer';

export type NoteType = 'text' | 'checklist';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteTag {
  name: string;
  color: string; // Tailwind hex or color class
}

export interface YoutubeLink {
  id: string;
  url: string;
  title: string;
  videoId: string;
}

export interface WebResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface ImportantQuestion {
  id: string;
  question: string;
  answer: string;
  priority?: 'high' | 'medium' | 'normal';
  isImportant?: boolean;
}

// Developer Mod Data Blocks
export interface ApiKeyItem {
  id: string;
  name: string; // e.g. "OPENAI_API_KEY", "STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE"
  value: string; // The secret key
  environment?: 'development' | 'staging' | 'production' | 'test';
  notes?: string;
}

export interface PromptBoxItem {
  id: string;
  title: string; // e.g. "PRD Generation System Prompt", "SQL Query Builder"
  prompt: string; // Prompt text
  category?: string; // Optional category tag
}

export interface SpecFileItem {
  id: string;
  fileName: string; // e.g. "PRD.md", "README.md", "SCHEMA.sql", "ARCHITECTURE.md"
  fileType?: 'markdown' | 'json' | 'sql' | 'typescript' | 'yaml' | 'env' | 'other';
  content: string;
  description?: string;
}

export interface DevWebsiteCredentialItem {
  id: string;
  serviceName: string; // e.g. "Supabase Dashboard", "AWS Console", "Vercel", "GitHub"
  url: string; // e.g. "https://supabase.com/dashboard"
  emailOrUsername?: string; // login email or username
  passwordOrToken?: string; // password or personal access token
  notes?: string;
}

export interface DevVideoResourceItem {
  id: string;
  title: string;
  url: string;
  videoId?: string;
  notes?: string;
}

export interface StudentChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  attachedImage?: string;
  attachedSketch?: string;
  model?: string;
}

export interface StudentDoubtSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  subject?: string;
  messages: StudentChatMessage[];
}

export interface AuthUser {
  uid: string;
  id?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  createdAt?: string | number;
  lastLoginAt?: string | number;
  provider?: string;
}

export interface ConflictCopy {
  id: string;
  originalNoteId: string;
  title: string;
  body: string;
  remoteUpdatedAt: number;
  savedAt: number;
  reason?: string;
}

export interface StorageHealthInfo {
  isPersisted: boolean;
  isIncognito: boolean;
  usedBytes: number;
  quotaBytes: number;
  usagePercentage: number;
  isLowSpace: boolean; // >90% full
}

export interface NoteItem {
  id: string;
  userId?: string;
  user_id?: string;
  type: NoteType;
  title: string;
  body: string; // Markdown-lite / rich HTML content
  checklistItems: ChecklistItem[];
  images?: string[]; // Attached photos / images (data URLs or URLs)
  sketches?: string[]; // Hand-drawn sketches / doodles
  youtubeLinks?: YoutubeLink[]; // Embedded YouTube lecture videos
  webLinks?: WebResourceLink[]; // External resources/links with title & purpose
  importantQuestions?: ImportantQuestion[]; // Most important exam questions cards
  studentSubject?: string; // Optional academic subject (Physics, Math, History, etc.)
  quickFormulas?: string[]; // Key formulas / formulas cheat sheet
  
  // Developer Mod Modular Blocks
  apiKeys?: ApiKeyItem[];
  promptBoxes?: PromptBoxItem[];
  specFiles?: SpecFileItem[];
  devWebsites?: DevWebsiteCredentialItem[];
  devVideos?: DevVideoResourceItem[];

  folderId?: string; // ID of folder, or undefined/'uncategorised'
  tags: NoteTag[];
  isPinned: boolean;
  isArchived?: boolean; // Safe storage archive flag
  isDeleted?: boolean; // In 30-day trash recycle bin
  deletedAt?: number; // Unix timestamp in ms when moved to trash
  color?: string; // Optional card tint
  mode: AppMode;
  createdAt: number; // Unix timestamp in ms
  updatedAt: number; // Unix timestamp in ms

  // Local-First Zero Data Loss Sync Metadata
  syncStatus?: 'pending' | 'synced' | 'conflict';
  lastSyncAttempt?: number;
}

export interface FeedbackItem {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  type: 'bug' | 'idea' | 'feedback';
  title: string;
  description: string;
  attachment?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminNote?: string;
  createdAt: number;
}

export interface AppBranding {
  logoUrl: string | null;
  appName?: string;
  showAdsBanner?: boolean; // Toggle for Promotional / Ads card on home screen (Default: false / hidden)
  updatedAt?: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  notesCount?: number;
  createdAt?: number;
  lastActiveAt?: number;
  provider?: string;
  role?: 'admin' | 'user';
}

export interface FolderItem {
  id: string;
  userId?: string;
  user_id?: string;
  name: string;
  createdAt: number;
  color?: string;
}

export interface AdSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  accent: string;
  ctaText?: string;
  linkUrl?: string;
}

// Kanban task for Build Mode
export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
}

export interface BugItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
  notes?: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  type: 'github' | 'figma' | 'docs' | 'other';
}

export interface LaunchChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SectionNote {
  id: string;
  section: string; // 'idea' | 'planning' | 'tasks' | 'bugs' | 'resources' | 'launch' | 'general'
  title: string;
  content: string;
  createdAt: string;
}

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  mastered?: boolean;
}

export interface WeakTopicItem {
  id: string;
  topic: string;
  confidence: number; // 1 to 5
}

export interface ChapterItem {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
}

export interface ApiEndpointItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
}

export interface ProjectItem {
  id: string;
  userId?: string;
  user_id?: string;
  title: string;
  subtitle?: string;
  description: string;
  mode: AppMode;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPinned?: boolean;
  color?: string;
  coverGradient?: string;
  
  // Student Mod Data
  studentData?: {
    subject?: string;
    chapters?: ChapterItem[];
    keyPoints?: string[];
    flashcards?: FlashcardItem[];
    weakTopics?: WeakTopicItem[];
    studyStreak?: number;
  };

  // Developer Mod Data
  developerData?: {
    language?: string;
    codeSnippet?: string;
    repoUrl?: string;
    apiEndpoints?: ApiEndpointItem[];
    techNotes?: string;
  };

  // Build Mod Data (Flagship)
  buildData?: {
    idea?: string;
    planning?: string;
    status?: 'planning' | 'in-progress' | 'testing' | 'deployed';
    version?: string;
    progress?: number; // 0 - 100
    kanbanTasks?: KanbanTask[];
    tasks?: { text: string; completed: boolean }[]; // Legacy compatibility
    bugs?: BugItem[];
    resources?: ResourceLink[];
    launchChecklist?: LaunchChecklistItem[];
    sectionNotes?: SectionNote[];
  };
}

export const TAG_COLORS = [
  { name: 'Red', hex: '#ef4444', bg: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'Amber', hex: '#f59e0b', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  { name: 'Green', hex: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Teal', hex: '#14b8a6', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Purple', hex: '#8b5cf6', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Gray', hex: '#6b7280', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
];

