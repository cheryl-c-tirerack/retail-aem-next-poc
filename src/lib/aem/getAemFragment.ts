import 'server-only';

import { aemEnvFor, aemHostFor, routeAssetsToProd } from './aemSources';

const AEM_CONTENT_ROOT = '/content/tirerack/desktop/';
const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 5000;

// Akamai serves this page with HTTP 200 when it blocks a request (see retail-aem-next-poc-docs/POC-REPORT.md, Step 0).
const AKAMAI_BLOCK_MARKER = 'This page is currently unavailable';

export type AemFragmentResult =
  | { ok: true; html: string }
  | { ok: false; status: number | 'blocked' | 'timeout' | 'network' | 'config'; path: string };

/**
 * Fetches a rendered AEM HTML fragment on the server, the way
 * CQServiceHandlerImpl.invokeCQ does for retail_desktop. Stage or prod is picked per path
 * (see aemSources.ts).
 * @param path - path under /content/tirerack/desktop/, e.g. 'en.headerResponsive.html'
 */
export async function getAemFragment(path: string): Promise<AemFragmentResult> {
  const env = aemEnvFor(path);
  const host = aemHostFor(env);

  if (!host) {
    console.error(`[aem] AEM host for ${env} is not set (AEM_HOST_STAGE / AEM_HOST_PROD)`);
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

    console.info(`[aem] ${path} env=${env} status=${response.status} bytes=${html.length} ms=${elapsed()}`);
    return { ok: true, html: env === 'prod' ? routeAssetsToProd(html) : html };
  } catch (error) {
    const status = error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network';
    console.warn(`[aem] ${path} status=${status} ms=${elapsed()}`);
    return { ok: false, status, path };
  }
}
