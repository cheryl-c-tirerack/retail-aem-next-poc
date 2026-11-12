import 'server-only';

// Server-only client for the retail BFF (bff-retail-desktop, behind gateway-retail-desktop).
// The vehicles endpoints need no token. Calls that need one (search-index) take a bearer token;
// a dev service credential is a backend prerequisite (see JAVA-CONTRACT-PLAN.md), so those stay
// stubbed until it exists. This is the single seam that knows the BFF's URL and envelope.

const TIMEOUT_MS = 5000;

export type BffResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | 'timeout' | 'network' | 'config'; path: string };

// Envelope every BFF response is wrapped in (…ApiResponse in the generated types).
type BffEnvelope<T> = { data: T; status?: string };

type BffRequest = {
  path: string;
  searchParams?: Record<string, string | number | boolean | undefined>;
  token?: string;
};

function buildUrl(base: string, path: string, searchParams?: BffRequest['searchParams']): string {
  const url = new URL(path, base);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * GETs a BFF endpoint and unwraps its `data` envelope. Returns a discriminated result; never throws.
 */
export async function bffGet<T>({ path, searchParams, token }: BffRequest): Promise<BffResult<T>> {
  const base = process.env.BFF_URL;

  if (!base) {
    console.error('[bff] BFF_URL is not set');
    return { ok: false, status: 'config', path };
  }

  const url = buildUrl(base, path, searchParams);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });

    if (!response.ok) {
      console.warn(`[bff] ${path} status=${response.status}`);
      return { ok: false, status: response.status, path };
    }

    const envelope = (await response.json()) as BffEnvelope<T>;
    return { ok: true, data: envelope.data };
  } catch (error) {
    const status = error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network';
    console.warn(`[bff] ${path} status=${status}`);
    return { ok: false, status, path };
  }
}
