'use client';

import { Suspense } from 'react';
import LeafPage from './LeafPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading leaf...</div>}>
      <LeafPage />
    </Suspense>
  );
}
