import { API_URL } from './constants';

export interface Chapter {
  id: number;
  name: string;
  type: string;
  status: string | null;
  chartered: number | null;
  province: string | null;
  city: string | null;
  state: string | null;
  contact_email: string | null;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  category_id: number | null;
  seller_name?: string;
  seller_business_name?: string | null;
  seller_fraternity_member_id?: number | null;
  seller_sponsoring_chapter_id?: number | null;
  seller_initiated_chapter_id?: number | null;
  seller_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
}

export interface Event {
  id: number;
  promoter_id: number;
  title: string;
  description: string | null;
  event_date: string;
  location: string;
  city: string | null;
  state: string | null;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  ticket_price_cents: number;
  max_attendees: number | null;
  promoter_name?: string;
  promoter_email?: string;
  promoter_fraternity_member_id?: number | null;
  promoter_sponsoring_chapter_id?: number | null;
  promoter_initiated_chapter_id?: number | null;
  is_fraternity_member?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  is_seller?: boolean;
}

export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const res = await fetch(`${API_URL}/api/chapters`);
    if (!res.ok) throw new Error('Failed to fetch chapters');
    return res.json();
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/products`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_URL}/api/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function fetchTotalDonations(): Promise<number> {
  try {
    const res = await fetch(`${API_URL}/api/donations/total`);
    if (!res.ok) throw new Error('Failed to fetch total donations');
    const data = await res.json();
    return data.total_donations_cents || 0;
  } catch (error) {
    console.error('Error fetching total donations:', error);
    return 0;
  }
}


