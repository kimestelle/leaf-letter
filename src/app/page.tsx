'use client';
import { useState } from "react";
import Link from "next/link";
import VineCanvas from "@/components/VineCanvas";

export default function Home() {
  const [input, setInput] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <VineCanvas/>
        <div className='aspect-[1/1] bg-[linear-gradient(to_top,rgba(255,255,255,0.5)_0%,rgba(255,0,0,0)_100%)] rounded-full p-20 flex flex-col justify-center items-center'>
        <h1>leaf * let</h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <input
            type="text"
            placeholder="Write a note for..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border-b border-white mb-2 focus:outline-none"
          />
        <Link
          className="px-4 my-2 py-2 bg-black text-white rounded-full"
          href={`/leaf?seed=${encodeURIComponent(input)}`}
          style={{ textDecoration: 'none' }}
        >
          <p className='text-white'>grow leaf</p>
        </Link>
        </form>
        </div>
      </div>
    </main>
  );
}
