export type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export interface Delivery {
  id: string;
  reference: string;
  description: string;
  photos: string[];
  recipientName: string;
  recipientPhone: string;
  address: string;
  price: number;
  expectedDate: string;
  notes: string;
  status: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  proofPhotos: string[];
  signature?: string;
  comments: Comment[];
  clientId?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  deliveryCount: number;
  createdAt: string;
}

export interface DailyStats {
  date: string;
  count: number;
  revenue: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
