'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ScrollToSeller() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get('seller');

  useEffect(() => {
    if (sellerId) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const element = document.getElementById(`seller-${sellerId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [sellerId]);

  return null;
}


