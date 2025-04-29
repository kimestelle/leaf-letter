'use client';

import { Suspense } from 'react';
import WritePage from './WritePage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading leaf...</div>}>
      <WritePage />
    </Suspense>
  );
}
