import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { getAemFragment } from '@/lib/aem/getAemFragment';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tire Rack',
  description: 'Retail AEM + Next.js POC',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  // Inline scripts inside the footer HTML do not run when set through dangerouslySetInnerHTML.
  // They stay inert until the keep list loads the allowed ones (Step 4c).
  const footer = await getAemFragment('en.footerResponsive.html');

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <main>{children}</main>
        {footer.ok && <div data-aem="footer" dangerouslySetInnerHTML={{ __html: footer.html }} />}
      </body>
    </html>
  );
}
