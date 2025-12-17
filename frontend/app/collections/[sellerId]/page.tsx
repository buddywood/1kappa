import { notFound } from 'next/navigation';
import { getSellerWithProducts, fetchChapters, fetchProductCategories, type SellerWithProducts } from '@/lib/api';
import { SEED_FEATURED_BROTHERS, SEED_PRODUCTS } from '@/lib/seedData';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SellerStoreView from './SellerStoreView';

export const dynamic = 'force-dynamic';

interface SellerStorePageProps {
  params: { sellerId: string };
}

export default async function SellerStorePage({ params }: SellerStorePageProps) {
  const sellerId = parseInt(params.sellerId);
  
  // Check for seed data first
  const seedBrother = SEED_FEATURED_BROTHERS.find(b => b.id === sellerId);
  
  let seller: SellerWithProducts | null = null;
  let chapters: any[] = [];
  let categories: any[] = [];

  if (seedBrother) {
     // Construct seed seller object
     const seedProducts = SEED_PRODUCTS.filter(p => p.seller_id === sellerId);
     seller = {
       ...seedBrother,
       email: `${seedBrother.name.replace(' ', '.').toLowerCase()}@example.com`,
       business_email: `${seedBrother.name.replace(' ', '.').toLowerCase()}@business.com`,
       business_phone: '555-0123',
       kappa_vendor_id: 'K123456',
       merchandise_type: 'KAPPA',
       store_logo_url: seedBrother.headshot_url,
       status: 'APPROVED',
       verification_status: 'VERIFIED',
       stripe_account_id: 'acct_mock_123',
       stripe_account_type: 'company',
       tax_id: null,
       business_address_line1: '123 Kappa Way',
       business_address_line2: null,
       business_city: seedBrother.chapter_name ? seedBrother.chapter_name.split(' ')[0] : 'City',
       business_state: 'BC',
       business_postal_code: '12345',
       business_country: 'US',
       is_fraternity_member: true,
       is_seller: true,
       is_promoter: false,
       is_steward: false,
       product_count: seedProducts.length,
       products: seedProducts,
       social_links: {}
     } as SellerWithProducts;

     // Fetch chapters/categories for context if available, or use defaults
     const results = await Promise.all([
        fetchChapters().catch(() => []),
        fetchProductCategories().catch(() => [])
     ]);
     chapters = results[0];
     categories = results[1];
  } else {
    // Normal API fetch
    const results = await Promise.all([
      getSellerWithProducts(sellerId).catch((err) => {
        console.error(`Error fetching seller ${sellerId}:`, err);
        return null;
      }),
      fetchChapters().catch((err) => {
        console.error('Error fetching chapters:', err);
        return [];
      }),
      fetchProductCategories().catch((err) => {
        console.error('Error fetching categories:', err);
        return [];
      }),
    ]);
    seller = results[0];
    chapters = results[1];
    categories = results[2];
  }

  if (!seller) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-cream text-midnight-navy">
      <Header />
      <SellerStoreView 
        seller={seller}
        chapters={chapters}
        categories={categories}
      />
      <Footer />
    </div>
  );
}

