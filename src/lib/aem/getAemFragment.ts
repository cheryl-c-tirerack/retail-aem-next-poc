import 'server-only';

const AEM_CONTENT_ROOT = '/content/tirerack/desktop/';
const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 5000;

// Akamai serves this page with HTTP 200 when it blocks a request (see POC-REPORT.md, Step 0).
const AKAMAI_BLOCK_MARKER = 'This page is currently unavailable';

export type AemFragmentResult =
  | { ok: true; html: string }
  | { ok: false; status: number | 'blocked' | 'timeout' | 'network' | 'config'; path: string };

/**
 * Fetches a rendered AEM HTML fragment on the server, the way
 * CQServiceHandlerImpl.invokeCQ does for retail_desktop.
 * @param path - path under /content/tirerack/desktop/, e.g. 'en.headerResponsive.html'
 */
export async function getAemFragment(path: string): Promise<AemFragmentResult> {
  const host = process.env.AEM_HOST;

  if (!host) {
    console.error('[aem] AEM_HOST is not set');
    return { ok: false, status: 'config', path };
  }

  const url = `${host}${AEM_CONTENT_ROOT}${path}`;
  const started = Date.now();
  const elapsed = (): number => Date.now() - started;

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[aem] ${path} status=${response.status} ms=${elapsed()}`);
      return { ok: false, status: response.status, path };
    }

    const html = await response.text();

    if (html.includes(AKAMAI_BLOCK_MARKER)) {
      console.warn(`[aem] ${path} status=blocked ms=${elapsed()}`);
      return { ok: false, status: 'blocked', path };
    }

    console.info(`[aem] ${path} status=${response.status} bytes=${html.length} ms=${elapsed()}`);
    return { ok: true, html };
  } catch (error) {
    const status = error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network';
    console.warn(`[aem] ${path} status=${status} ms=${elapsed()}`);
    return { ok: false, status, path };
  }
}
