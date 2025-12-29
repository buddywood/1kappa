import { notFound } from 'next/navigation';
import { getSellerWithProductsBySlug, fetchChapters, fetchProductCategories, type SellerWithProducts } from '@/lib/api';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import SellerStoreView from '../../[sellerId]/SellerStoreView';

export const dynamic = 'force-dynamic';

interface SellerStorePageProps {
  params: { slug: string };
}

export default async function SellerStorePage({ params }: SellerStorePageProps) {
  const { slug } = params;
  
  let seller: SellerWithProducts | null = null;
  let chapters: any[] = [];
  let categories: any[] = [];

  // Normal API fetch
  const results = await Promise.all([
    getSellerWithProductsBySlug(slug).catch((err) => {
      console.error(`Error fetching seller by slug ${slug}:`, err);
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
