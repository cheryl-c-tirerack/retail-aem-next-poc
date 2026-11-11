import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getAemFragment } from '@/lib/aem/getAemFragment';
import { formatTireSize, parseTireSize, seoContentPath } from '@/lib/aem/seoSelector';

export async function generateMetadata({ params }: PageProps<'/tires/[size]'>): Promise<Metadata> {
  const { size } = await params;
  const tireSize = parseTireSize(size);

  return {
    title: tireSize ? `${formatTireSize(tireSize)} Tires | Tire Rack` : 'Tire size not found | Tire Rack',
  };
}

export default async function TireSizePage({ params }: PageProps<'/tires/[size]'>) {
  const { size } = await params;
  const tireSize = parseTireSize(size);

  if (!tireSize) {
    notFound();
  }

  const seo = await getAemFragment(seoContentPath(tireSize));

  return (
    <>
      <h1>{formatTireSize(tireSize)} Tires</h1>
      {seo.ok && <div dangerouslySetInnerHTML={{ __html: seo.html }} />}
    </>
  );
}
