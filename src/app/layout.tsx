import './globals.css';
import { ReactNode } from 'react';
import { Cormorant_Garamond, Proza_Libre } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'], // choose weights you need
  variable: '--font-cormorant'
});

const proza = Proza_Libre({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-proza'
});

export const metadata = {
  title: 'Cordate Leaf',
  description: 'L-System leaf rendered with p5.js in Next.js App Router',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${proza.variable}`}>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
