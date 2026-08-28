import { FolderItem, AppMode } from '../types';

export interface AutoCategorizeResult {
  suggestedFolder: {
    id: string | null;
    name: string;
    isNew: boolean;
    confidence: number;
    reason: string;
  } | null;
  suggestedTags: string[];
  suggestedTitle?: string;
}

export async function requestAutoCategorization(params: {
  title: string;
  content: string;
  existingFolders: FolderItem[];
  mode?: AppMode;
}): Promise<AutoCategorizeResult | null> {
  const { title, content, existingFolders, mode = 'normal' } = params;

  try {
    const response = await fetch('/api/ai/auto-categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        existingFolders: existingFolders.map((f) => ({ id: f.id, name: f.name })),
        mode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Auto-categorize HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Failed to request AI auto-categorization:', err);
    return null;
  }
}
