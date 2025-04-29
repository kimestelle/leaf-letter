'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WritePage() {
  const [letter, setLetter] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchParams = useSearchParams();
  const seed = searchParams.get('seed');

  useEffect(() => {
    if (!seed) return;
    const storedImage = localStorage.getItem(`leaf-${seed}`);
    if (storedImage) {
      setImgSrc(storedImage);
    }
  }, [seed]);

  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      if (letter) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '32px Cormorant Garamond';
        ctx.fillStyle = 'rgba(50, 30, 20, 0.8)';
        ctx.fillText(letter, 0, 0);
        ctx.restore();
      }
    };
  }, [imgSrc, letter]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-canvas">
      <input
        type="text"
        placeholder="Write here..."
        value={letter}
        onChange={(e) => setLetter(e.target.value)}
        className="mb-4 p-2 border rounded w-[300px] text-center"
      />
      <div className="relative w-[1000px] h-[700px] rounded bg-white/25 shadow-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1000}
          height={700}
          className="w-full h-full"
        />
      </div>
      <button
        onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) {
            const link = document.createElement('a');
            link.download = `leaf-letter-${seed}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
          }
        }}
        className="mt-4 p-2 border rounded bg-white"
      >
        Download PNG
      </button>
    </div>
  );
}
