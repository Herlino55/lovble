import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: { name: string; avatar_url: string | null } | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', session.user.id)
        .single();
      set({ user: session.user, profile, isAuthenticated: true, loading: false });
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      // ✅ Ignorer SIGNED_IN initial (déjà géré au-dessus)
      if (event === 'INITIAL_SESSION') return;
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('user_id', session.user.id)
          .single();
        set({ user: session.user, profile, isAuthenticated: true, loading: false });
      } else {
        set({ user: null, profile: null, isAuthenticated: false, loading: false });
      }
    });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signup: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  logout: async () => {
    const { useRoleStore } = await import('./roleStore');
    await supabase.auth.signOut();
    useRoleStore.getState().reset();
    set({ user: null, profile: null, isAuthenticated: false });
  },
}));
