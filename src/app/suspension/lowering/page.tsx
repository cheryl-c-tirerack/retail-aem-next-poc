import type { Metadata } from 'next';

import { AemContent } from '@/lib/aem/AemContent';

// Mirrors retail_desktop's suspension/tech/lookatlowering.jsp, which embeds this AEM block with
// <tirerack:CQResource url=".../lookatlowering.html" />.
const LOWERING_PATH = 'en/parts/suspension/_jcr_content/root/container/lookatlowering.html';

export const metadata: Metadata = {
  title: 'A Look at Lowering | Tire Rack',
};

export default function LoweringPage() {
  return (
    <>
      <h1>A Look at Lowering</h1>
      <AemContent path={LOWERING_PATH} />
      {/* TR.js is the legacy shared Tomcat utility that defines changeTRTabs() for the block's tab
          arrows. retail_desktop serves it at /scripts/TR.js; we serve the same file from public/. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- must define the global changeTRTabs before the block's inline onclick handlers fire */}
      <script src="/scripts/TR.js" />
    </>
  );
}
