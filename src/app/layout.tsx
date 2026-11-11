import type { Metadata } from 'next';

import { parseFragment } from '@/lib/aem/extractScripts';
import { getAemFragment } from '@/lib/aem/getAemFragment';

import './globals.css';

export const metadata: Metadata = {
  title: 'Tire Rack',
  description: 'Retail AEM + Next.js POC',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const footerResult = await getAemFragment('en.footerResponsive.html');
  const footer = footerResult.ok ? parseFragment(footerResult.html, 'footer') : null;

  if (footer) {
    console.info(`[aem] footer kept=${footer.kept.map((tag) => tag.id).join(',')} dropped=${footer.dropped.length}`);
  }

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        {footer && <div data-aem="footer" dangerouslySetInnerHTML={{ __html: footer.html }} />}
      </body>
    </html>
  );
}
