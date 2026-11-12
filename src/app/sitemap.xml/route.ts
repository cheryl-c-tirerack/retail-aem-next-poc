import { getAemFragment } from '@/lib/aem/getAemFragment';

// AEM generates the sitemap at /content/tirerack/desktop/en.sitemap.xml. We serve it at
// /sitemap.xml (where crawlers look), passing AEM's XML straight through.
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const result = await getAemFragment('en.sitemap.xml');

  if (!result.ok) {
    return new Response('Sitemap is not available right now.', { status: 502 });
  }

  return new Response(result.html, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
