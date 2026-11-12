export type AemEnv = 'stage' | 'prod';

// AEM paths (under /content/tirerack/desktop/, exactly as passed to getAemFragment) served from the
// prod dispatcher. Everything else comes from stage. Add a path here to switch it to prod.
const PROD_PATHS: ReadonlySet<string> = new Set(['en/wheels.html']);

// Root-relative asset prefixes AEM HTML points at. The browser asks our app for these, and
// next.config.ts rewrites them to AEM.
export const AEM_ASSET_PREFIXES = [
  'etc.clientlibs',
  'etc/designs',
  'content/dam',
  'content/tirerack',
] as const;

// Prod HTML has its asset paths moved under this prefix so next.config can send them to prod
// instead of stage.
export const PROD_ASSET_PREFIX = '/aem-prod';

const ASSET_PATH = new RegExp(
  `(^|["'\\s,(=])/(${AEM_ASSET_PREFIXES.map((p) => p.replace('.', '\\.')).join('|')})/`,
  'g',
);

export function aemEnvFor(path: string): AemEnv {
  return PROD_PATHS.has(path) ? 'prod' : 'stage';
}

export function aemHostFor(env: AemEnv): string | undefined {
  return env === 'prod'
    ? process.env.AEM_HOST_PROD
    : process.env.AEM_HOST_STAGE;
}

/**
 * Points root-relative AEM asset paths in prod HTML at the prod proxy prefix, so images, CSS and
 * JS load from the same dispatcher as the page. Covers src, href, srcset, data-cmp-src and url().
 */
export function routeAssetsToProd(html: string): string {
  return html.replace(ASSET_PATH, `$1${PROD_ASSET_PREFIX}/$2/`);
}
