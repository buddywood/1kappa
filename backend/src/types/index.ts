export interface Chapter {
  id: number;
  name: string;
  type: string;
  province: string;
  city: string;
  state: string;
  contact_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Seller {
  id: number;
  email: string;
  name: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id: number | null;
  headshot_url: string | null;
  social_links: Record<string, string>;
  stripe_account_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  chapter_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface SellerApplication {
  name: string;
  email: string;
  membership_number: string;
  initiated_chapter_id: number;
  sponsoring_chapter_id?: number;
  headshot_url: string;
  social_links: Record<string, string>;
}

