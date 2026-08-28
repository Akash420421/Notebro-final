import { AppBranding, AdminUserItem, FeedbackItem } from '../types';
import { supabase } from './supabase';

const CACHED_BRANDING_KEY = 'projectnotes_app_branding';
const BRANDING_SUBSCRIBERS = new Set<(branding: AppBranding) => void>();

class AdminService {
  private currentBranding: AppBranding = {
    logoUrl: '/app-logo.png',
    appName: 'Note Bro',
    showAdsBanner: false,
    updatedAt: Date.now(),
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const DEFAULT_LOGO = '/app-logo.png';
      const DEFAULT_APP = 'Note Bro';
      try {
        const cached = localStorage.getItem(CACHED_BRANDING_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.currentBranding = {
            logoUrl: parsed.logoUrl || DEFAULT_LOGO,
            appName: parsed.appName || DEFAULT_APP,
            showAdsBanner: typeof parsed.showAdsBanner === 'boolean' ? parsed.showAdsBanner : false,
            updatedAt: parsed.updatedAt || Date.now(),
          };
        }
      } catch (e) {}
      this.loadBrandingFromServer();
    }
  }

  public subscribeBranding(listener: (branding: AppBranding) => void): () => void {
    BRANDING_SUBSCRIBERS.add(listener);
    listener(this.currentBranding);
    return () => BRANDING_SUBSCRIBERS.delete(listener);
  }

  private notifyBranding() {
    try {
      localStorage.setItem(CACHED_BRANDING_KEY, JSON.stringify(this.currentBranding));
    } catch (e) {}
    BRANDING_SUBSCRIBERS.forEach((l) => l(this.currentBranding));
  }

  public getBranding(): AppBranding {
    return this.currentBranding;
  }

  public async loadBrandingFromServer(): Promise<AppBranding> {
    const DEFAULT_LOGO = '/app-logo.png';
    const DEFAULT_APP = 'Note Bro';

    // 1. Try server API
    try {
      const res = await fetch('/api/admin/branding');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          this.currentBranding = {
            logoUrl: data.logoUrl || DEFAULT_LOGO,
            appName: data.appName || DEFAULT_APP,
            showAdsBanner: typeof data.showAdsBanner === 'boolean' ? data.showAdsBanner : false,
            updatedAt: data.updatedAt || Date.now(),
          };
          this.notifyBranding();
          return this.currentBranding;
        }
      }
    } catch (e) {}

    // 2. Try Supabase app_settings table
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'branding')
        .maybeSingle();

      if (data?.value) {
        this.currentBranding = {
          logoUrl: data.value.logoUrl || DEFAULT_LOGO,
          appName: data.value.appName || DEFAULT_APP,
          showAdsBanner: typeof data.value.showAdsBanner === 'boolean' ? data.value.showAdsBanner : false,
          updatedAt: data.value.updatedAt || Date.now(),
        };
        this.notifyBranding();
      }
    } catch (e) {}

    return this.currentBranding;
  }

  public async updateBranding(
    logoUrl: string | null,
    appName: string = 'Note Bro',
    showAdsBanner?: boolean
  ): Promise<AppBranding> {
    this.currentBranding = {
      logoUrl,
      appName,
      showAdsBanner: typeof showAdsBanner === 'boolean' ? showAdsBanner : (this.currentBranding.showAdsBanner ?? false),
      updatedAt: Date.now(),
    };
    this.notifyBranding();

    // 1. Push to server API
    try {
      await fetch('/api/admin/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentBranding),
      });
    } catch (e) {}

    // 2. Push to Supabase app_settings table
    try {
      await supabase.from('app_settings').upsert({
        key: 'branding',
        value: this.currentBranding,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}

    return this.currentBranding;
  }

  public async syncUserActivity(user: {
    id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    bio?: string;
    notesCount?: number;
    provider?: string;
  }): Promise<void> {
    if (!user || (!user.id && !user.email)) return;

    const payload = {
      id: user.id,
      email: user.email,
      display_name: user.displayName || user.email.split('@')[0] || 'User',
      photo_url: user.photoURL || '',
      bio: user.bio || '',
      notes_count: user.notesCount || 0,
      provider: user.provider || 'supabase',
      last_active_at: Date.now(),
    };

    // 1. Sync to server API
    try {
      await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {}

    // 2. Sync to Supabase users table
    try {
      await supabase.from('users').upsert(payload);
    } catch (e) {}
  }

  public async fetchAllUsers(): Promise<AdminUserItem[]> {
    // 1. Try server API
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          return data.users;
        }
      }
    } catch (e) {}

    // 2. Fallback to Supabase users table
    try {
      const { data } = await supabase.from('users').select('*').limit(100);
      if (Array.isArray(data)) {
        return data.map((u) => ({
          id: u.id,
          email: u.email || 'user@notebro.app',
          displayName: u.display_name || 'Note Bro Member',
          photoURL: u.photo_url,
          bio: u.bio,
          notesCount: u.notes_count || 0,
          createdAt: u.created_at ? new Date(u.created_at).getTime() : Date.now(),
          lastActiveAt: u.last_active_at || Date.now(),
          provider: u.provider || 'supabase',
          role: u.role || 'user',
        }));
      }
    } catch (e) {}

    return [];
  }

  public async submitFeedback(data: {
    userId?: string;
    userEmail?: string;
    userName?: string;
    type: 'bug' | 'idea' | 'feedback';
    title: string;
    description: string;
    attachment?: string;
  }): Promise<FeedbackItem> {
    const payload = {
      ...data,
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    let createdItem: FeedbackItem | null = null;

    // 1. Post to Server API
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        createdItem = json.feedback;
      }
    } catch (e) {}

    // 2. Post to Supabase feedback table
    try {
      const { data: supaFb } = await supabase
        .from('feedback')
        .insert({
          user_id: data.userId,
          user_email: data.userEmail,
          user_name: data.userName,
          type: data.type,
          title: data.title,
          description: data.description,
          attachment: data.attachment,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (supaFb && !createdItem) {
        createdItem = {
          id: supaFb.id,
          ...payload,
        };
      }
    } catch (e) {}

    return (
      createdItem || {
        id: `fb-${Date.now()}`,
        ...payload,
      }
    );
  }

  public async fetchAllFeedback(): Promise<FeedbackItem[]> {
    // 1. Try server API
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.feedback)) {
          return data.feedback;
        }
      }
    } catch (e) {}

    // 2. Fallback to Supabase
    try {
      const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (Array.isArray(data)) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          userEmail: d.user_email,
          userName: d.user_name,
          type: d.type || 'feedback',
          title: d.title,
          description: d.description,
          attachment: d.attachment,
          status: d.status || 'pending',
          adminNote: d.admin_note,
          createdAt: d.created_at ? new Date(d.created_at).getTime() : Date.now(),
        }));
      }
    } catch (e) {}

    return [];
  }

  public async updateFeedbackStatus(
    id: string,
    status: 'pending' | 'reviewed' | 'resolved',
    adminNote?: string
  ): Promise<void> {
    try {
      await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote }),
      });
    } catch (e) {}

    try {
      await supabase
        .from('feedback')
        .update({
          status,
          admin_note: adminNote || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch (e) {}
  }
}

export const adminService = new AdminService();
