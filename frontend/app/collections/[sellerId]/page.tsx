import { notFound } from 'next/navigation';
import { getSellerWithProducts, fetchChapters, fetchProductCategories } from '@/lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SellerStoreView from './SellerStoreView';

export const dynamic = 'force-dynamic';

interface SellerStorePageProps {
  params: { sellerId: string };
}

export default async function SellerStorePage({ params }: SellerStorePageProps) {
  const sellerId = parseInt(params.sellerId);
  
  if (isNaN(sellerId)) {
    notFound();
  }

  const [seller, chapters, categories] = await Promise.all([
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

