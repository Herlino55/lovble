/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface RoleState {
  isSuperAdmin: boolean;
  canCreateDeliveries: boolean;
  canUpdateDeliveries: boolean;
  canDeleteDeliveries: boolean;
  parentId: string | null;
  loading: boolean;
  fetchRole: () => Promise<void>;
  reset: () => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  isSuperAdmin: false,
  canCreateDeliveries: false,
  canUpdateDeliveries: false,
  canDeleteDeliveries: false,
  parentId: null,
  loading: true,

  fetchRole: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isSuperAdmin: false, canCreateDeliveries: false, canUpdateDeliveries: false, canDeleteDeliveries: false, parentId: null, loading: false });
      return;
    }

    const [rolesRes, profileRes] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', user.id),
      supabase.from('profiles').select('parent_id').eq('user_id', user.id).single(),
    ]);

    const roles = (rolesRes.data || []).map((item) => item.role);
    const isSuperAdmin = roles.includes('superadmin');
    const parentId = (profileRes.data as any)?.parent_id || null;

    set({
      isSuperAdmin,
      canCreateDeliveries: isSuperAdmin || roles.includes('delivery_creator'),
      canUpdateDeliveries: isSuperAdmin || roles.includes('delivery_updater'),
      canDeleteDeliveries: isSuperAdmin || roles.includes('delivery_deleter'),
      parentId,
      loading: false,
    });
  },

  reset: () => set({ isSuperAdmin: false, canCreateDeliveries: false, canUpdateDeliveries: false, canDeleteDeliveries: false, parentId: null, loading: true }),
}));