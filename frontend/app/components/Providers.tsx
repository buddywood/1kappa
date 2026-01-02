'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';
import { CartProvider } from '../contexts/CartContext';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <CartProvider>
        {children}
        </CartProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}


