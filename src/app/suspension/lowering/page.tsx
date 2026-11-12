import type { Metadata } from 'next';

import { AemContent } from '@/lib/aem/AemContent';

// Mirrors retail_desktop's suspension/tech/lookatlowering.jsp, which embeds this AEM block with
// <tirerack:CQResource url=".../lookatlowering.html" />. The block's tab arrows call changeTRTabs(),
// defined in the shared legacy utility served at /scripts/TR.js (public/scripts/TR.js).
const LOWERING_PATH = 'en/parts/suspension/_jcr_content/root/container/lookatlowering.html';

export const metadata: Metadata = {
  title: 'A Look at Lowering | Tire Rack',
};

export default function LoweringPage() {
  return (
    <>
      <h1>A Look at Lowering</h1>
      <AemContent path={LOWERING_PATH} requireSrc="/scripts/TR.js" />
    </>
  );
}
