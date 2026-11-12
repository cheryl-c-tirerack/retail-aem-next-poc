import { getAemFragment } from '@/lib/aem/getAemFragment';

// Pass-through for whole AEM pages. Unlike the header/footer fragments, these pages ship their own
// <html>/<head> and their own header + footer, so they are returned as-is instead of being wrapped
// in the app shell. Example: /aem/en/wheels serves /content/tirerack/desktop/en/wheels.html.
// Assets (/etc.clientlibs, /content/dam, /images) resolve through next.config rewrites/redirects.
export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await params;
  const result = await getAemFragment(`${path.join('/')}.html`);

  if (!result.ok) {
    return new Response(`This AEM page is not available (status: ${String(result.status)}).`, { status: 502 });
  }

  return new Response(result.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
