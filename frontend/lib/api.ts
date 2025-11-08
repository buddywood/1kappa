const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Chapter {
  id: number;
  name: string;
  type: string;
  province: string;
  city: string;
  state: string;
  contact_email: string;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string;
  price_cents: number;
  image_url: string | null;
  sponsored_chapter_id: number | null;
  seller_name?: string;
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Order {
  id: number;
  product_id: number;
  buyer_email: string;
  amount_cents: number;
  status: 'PENDING' | 'PAID' | 'FAILED';
  product_name?: string;
  seller_name?: string;
  chapter_name?: string;
}

export async function fetchChapters(): Promise<Chapter[]> {
  const res = await fetch(`${API_URL}/api/chapters`);
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export async function createCheckoutSession(productId: number, buyerEmail: string): Promise<{ sessionId: string; url: string }> {
  const res = await fetch(`${API_URL}/api/checkout/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyer_email: buyerEmail }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  return res.json();
}

export async function submitSellerApplication(formData: FormData): Promise<Seller> {
  const res = await fetch(`${API_URL}/api/sellers/apply`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit application');
  }
  return res.json();
}

export async function fetchPendingSellers(adminKey: string): Promise<Seller[]> {
  const res = await fetch(`${API_URL}/api/admin/sellers/pending`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (!res.ok) throw new Error('Failed to fetch pending sellers');
  return res.json();
}

export async function updateSellerStatus(
  sellerId: number,
  status: 'APPROVED' | 'REJECTED',
  adminKey: string
): Promise<Seller> {
  const res = await fetch(`${API_URL}/api/admin/sellers/${sellerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update seller status');
  return res.json();
}

export async function fetchOrders(adminKey: string): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/admin/orders`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchDonations(adminKey: string) {
  const res = await fetch(`${API_URL}/api/admin/donations`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (!res.ok) throw new Error('Failed to fetch donations');
  return res.json();
}

