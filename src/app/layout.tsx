import type { Metadata } from 'next';
import { Fragment } from 'react';

import { type KeptTag, parseFragment } from '@/lib/aem/extractScripts';
import { getAemFragment } from '@/lib/aem/getAemFragment';

import { AEM_STUBS } from './aem-stubs';
import { HeaderSpacer } from './HeaderSpacer.client';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tire Rack',
  description: 'Retail AEM + Next.js POC',
};

const orderStamp = (id: string): string => `console.info('[aem-order] ${id}');`;

/**
 * Renders kept AEM tags as plain elements in source order, the way the JSP writes them.
 * Plain non-async scripts in the server HTML run in document order on page load, which the
 * kept inline scripts depend on (they call $ and trGetCookie from the clientlibs).
 * Each script is followed by an order stamp so the console shows the execution order.
 */
function AemKeptTags({ tags }: { tags: KeptTag[] }) {
  return tags.map((tag) => {
    switch (tag.kind) {
      case 'stylesheet':
        return <link key={tag.id} id={tag.id} rel="stylesheet" href={tag.href} precedence="aem" />;
      case 'style':
        return <style key={tag.id} id={tag.id} dangerouslySetInnerHTML={{ __html: tag.css }} />;
      case 'script':
        return tag.src ? (
          <Fragment key={tag.id}>
            <script id={tag.id} src={tag.src} />
            <script dangerouslySetInnerHTML={{ __html: orderStamp(tag.id) }} />
          </Fragment>
        ) : (
          <script key={tag.id} id={tag.id} dangerouslySetInnerHTML={{ __html: `${orderStamp(tag.id)}\n${tag.code}` }} />
        );
    }
  });
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [headResult, headerResult, footerResult] = await Promise.all([
    getAemFragment('en.rsResponsiveJSincludes.html'),
    getAemFragment('en.headerResponsive.html'),
    getAemFragment('en.footerResponsive.html'),
  ]);
  const head = headResult.ok ? parseFragment(headResult.html, 'head') : null;
  const header = headerResult.ok ? parseFragment(headerResult.html, 'header') : null;
  const footer = footerResult.ok ? parseFragment(footerResult.html, 'footer') : null;

  return (
    <html lang="en">
      <head>
        <script id="aem-stubs" dangerouslySetInnerHTML={{ __html: AEM_STUBS }} />
        {head && <AemKeptTags tags={head.kept} />}
      </head>
      <body>
        {header && <div data-aem="header" dangerouslySetInnerHTML={{ __html: header.html }} />}
        {header && <AemKeptTags tags={header.kept} />}
        <HeaderSpacer />
        {/* AEM's header has no skip link (neither does the JSP host), so <main> has no skip target to match. */}
        <main id="main-content">{children}</main>
        {footer && <div data-aem="footer" dangerouslySetInnerHTML={{ __html: footer.html }} />}
        {footer && <AemKeptTags tags={footer.kept} />}
      </body>
    </html>
  );
}
