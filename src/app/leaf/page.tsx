'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const LeafCanvas = dynamic(
  () => import('@/components/LeafCanvas'),
  { ssr: false, loading: () => null }
);

const progressText: Record<number, string> = {
  0: "growing skeleton...",
  10: "coloring shape...",
  20: "generating cells...",
  25: "coloring cells...",
  50: "adding details...",
  70: "more details...",
  90: "almost there...",
  100: "done!",
};

export default function LeafPage() {
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleProgressUpdate = useCallback((p: number) => {
    setProgress(p);
    if (p >= 100) setTimeout(() => setFinished(true), 500);
  }, []);
  

  const searchParams = useSearchParams();
  const seed = searchParams.get('seed');

  return (
    <div className="bg-canvas relative w-full h-screen flex items-center justify-center">
      {!finished && (
        <div className="absolute z-10 flex flex-col items-center">
          <h1 className="mb-4">Growing Leaf...</h1>
          <div className="w-64 h-4 border rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <h3 className="mt-2">{progressText[progress] || progressText[0]}</h3>
          <div className="mt-2"><h3>{progress}%</h3></div>
        </div>
      )}
      
      <div className={`${finished ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
        <LeafCanvas
            seed={seed || "a"}
            onProgressUpdate={handleProgressUpdate}
        />
      </div>
    </div>
  );
}
