import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DbClient = Tables<'clients'>;

interface ClientState {
  clients: DbClient[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (c: { name: string; phone: string; email: string; address: string }) => Promise<void>;
  updateClient: (id: string, c: Partial<{ name: string; phone: string; email: string; address: string }>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  loading: false,

  fetchClients: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    set({ clients: data || [], loading: false });
  },

  addClient: async (c) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('clients').insert({
      user_id: user.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
    }).select().single();
    if (data) set((s) => ({ clients: [data, ...s.clients] }));
  },

  updateClient: async (id, c) => {
    const { data } = await supabase.from('clients').update(c).eq('id', id).select().single();
    if (data) set((s) => ({ clients: s.clients.map((cl) => cl.id === id ? data : cl) }));
  },

  deleteClient: async (id) => {
    await supabase.from('clients').delete().eq('id', id);
    set((s) => ({ clients: s.clients.filter((cl) => cl.id !== id) }));
  },
}));
