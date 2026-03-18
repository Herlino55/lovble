/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DbDelivery = Tables<'deliveries'>;
type DbComment = Tables<'delivery_comments'>;

export interface DeliveryExpense {
  id: string;
  delivery_id: string;
  user_id: string;
  label: string;
  amount: number;
  created_at: string;
}

export interface Delivery extends DbDelivery {
  comments: DbComment[];
  expenses: DeliveryExpense[];
}

export interface DeliveryInput {
  reference: string;
  description: string;
  photos: string[];
  recipientName: string;
  recipientPhone: string;
  address: string;
  price: number;
  expectedDate: string;
  notes: string;
  clientId?: string;
}

interface DeliveryState {
  deliveries: Delivery[];
  loading: boolean;
  fetchDeliveries: () => Promise<void>;
  addDelivery: (d: DeliveryInput) => Promise<string | null>;
  updateDelivery: (id: string, d: DeliveryInput) => Promise<boolean>;
  updateStatus: (id: string, status: string) => Promise<void>;
  addComment: (deliveryId: string, text: string) => Promise<void>;
  addProofPhoto: (id: string, photoUrl: string) => Promise<void>;
  addExpense: (deliveryId: string, label: string, amount: number) => Promise<void>;
  deleteExpense: (expenseId: string, deliveryId: string) => Promise<void>;
  deleteDelivery: (id: string) => Promise<boolean>;
  getDelivery: (id: string) => Delivery | undefined;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  deliveries: [],
  loading: false,

  fetchDeliveries: async () => {
    set({ loading: true });
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!deliveries) { set({ loading: false }); return; }

    const { data: comments } = await supabase
      .from('delivery_comments')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: expenses } = await supabase
      .from('delivery_expenses')
      .select('*')
      .order('created_at', { ascending: true });

    const enriched: Delivery[] = deliveries.map((d) => ({
      ...d,
      comments: (comments || []).filter((c) => c.delivery_id === d.id),
      expenses: ((expenses || []) as DeliveryExpense[]).filter((e) => e.delivery_id === d.id),
    }));

    set({ deliveries: enriched, loading: false });
  },

  addDelivery: async (d) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Sub-users create deliveries under their parent's id
    const { data: profile } = await supabase.from('profiles').select('parent_id').eq('user_id', user.id).single();
    const ownerId = (profile as any)?.parent_id || user.id;

    const { data } = await supabase.from('deliveries').insert({
      user_id: ownerId,
      reference: d.reference,
      description: d.description,
      photos: d.photos,
      recipient_name: d.recipientName,
      recipient_phone: d.recipientPhone,
      address: d.address,
      price: d.price,
      expected_date: d.expectedDate || null,
      notes: d.notes,
      client_id: d.clientId || null,
    }).select().single();

    if (data) {
      set((s) => ({ deliveries: [{ ...data, comments: [], expenses: [] }, ...s.deliveries] }));
      return data.id;
    }
    return null;
  },

  updateDelivery: async (id, d) => {
    const { data } = await supabase.from('deliveries').update({
      reference: d.reference,
      description: d.description,
      photos: d.photos,
      recipient_name: d.recipientName,
      recipient_phone: d.recipientPhone,
      address: d.address,
      price: d.price,
      expected_date: d.expectedDate || null,
      notes: d.notes,
      client_id: d.clientId || null,
    }).eq('id', id).select().single();

    if (!data) return false;

    set((s) => ({
      deliveries: s.deliveries.map((delivery) =>
        delivery.id === id
          ? {
              ...delivery,
              ...data,
              comments: delivery.comments,
              expenses: delivery.expenses,
            }
          : delivery
      ),
    }));

    return true;
  },

  updateStatus: async (id, status) => {
    await supabase.from('deliveries').update({ status: status as any }).eq('id', id);
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, status: status as any, updated_at: new Date().toISOString() } : d
      ),
    }));
  },

  addComment: async (deliveryId, text) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('delivery_comments').insert({
      delivery_id: deliveryId,
      user_id: user.id,
      text,
    }).select().single();

    if (data) {
      set((s) => ({
        deliveries: s.deliveries.map((d) =>
          d.id === deliveryId ? { ...d, comments: [...d.comments, data] } : d
        ),
      }));
    }
  },

  addProofPhoto: async (id, photoUrl) => {
    const delivery = get().deliveries.find((d) => d.id === id);
    if (!delivery) return;
    const newPhotos = [...delivery.proof_photos, photoUrl];
    await supabase.from('deliveries').update({ proof_photos: newPhotos }).eq('id', id);
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === id ? { ...d, proof_photos: newPhotos } : d
      ),
    }));
  },

  addExpense: async (deliveryId, label, amount) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('delivery_expenses').insert({
      delivery_id: deliveryId,
      user_id: user.id,
      label,
      amount,
    }).select().single();

    if (data) {
      set((s) => ({
        deliveries: s.deliveries.map((d) =>
          d.id === deliveryId ? { ...d, expenses: [...d.expenses, data as DeliveryExpense] } : d
        ),
      }));
    }
  },

  deleteExpense: async (expenseId, deliveryId) => {
    await supabase.from('delivery_expenses').delete().eq('id', expenseId);
    set((s) => ({
      deliveries: s.deliveries.map((d) =>
        d.id === deliveryId ? { ...d, expenses: d.expenses.filter((e) => e.id !== expenseId) } : d
      ),
    }));
  },

  deleteDelivery: async (id) => {
    const { error } = await supabase.from('deliveries').delete().eq('id', id);
    if (error) return false;
    set((s) => ({ deliveries: s.deliveries.filter((d) => d.id !== id) }));
    return true;
  },

  getDelivery: (id) => get().deliveries.find((d) => d.id === id),
}));