'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { QueryProvider } from '@/hooks/useQueryProvider';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="relative">
          {children}
        </main>
      </div>
    </QueryProvider>
  );
}
