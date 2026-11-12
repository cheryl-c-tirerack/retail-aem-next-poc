import type { NextConfig } from 'next';

import { AEM_ASSET_PREFIXES, PROD_ASSET_PREFIX } from './src/lib/aem/aemSources';

const isDev = process.env.NODE_ENV === 'development';

// Safety net behind the keep list: the browser blocks any request to a host not listed here
// (Adobe Launch, analytics, vendors) and logs a CSP violation. 'unsafe-inline' is accepted for
// the POC because the kept AEM inline scripts need it. Dev mode adds what React refresh needs.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.tirerack.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://www.tirerack.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // http://www.tirerack.com too: the fragments use protocol-relative //www.tirerack.com image URLs,
  // which become http:// on an http://localhost page.
  // https://static.vordn.com serves the Tomcat /images/ paths (see redirects below).
  "img-src 'self' data: https://www.tirerack.com http://www.tirerack.com https://static.vordn.com",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "frame-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }],
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // /images/ is served by Tomcat, not AEM, so it 404s here. AEM's HTML, CSS and JS all point at it.
  // A redirect (not a rewrite) sends the browser to the static host: Akamai blocks server-side
  // fetches from that host but serves browsers.
  async redirects() {
    return [
      {
        source: '/images/:path*',
        destination: 'https://static.vordn.com/images/:path*',
        permanent: false,
      },
    ];
  },
  // AEM HTML references assets (clientlibs, DAM, core-image renditions under /content/tirerack) as
  // root-relative paths; forward those to AEM. Stage pages use the plain paths; prod pages have them
  // moved under /aem-prod by getAemFragment, so they load from the same dispatcher as the page.
  async rewrites() {
    const stageHost = process.env.AEM_HOST_STAGE;
    const prodHost = process.env.AEM_HOST_PROD;

    return AEM_ASSET_PREFIXES.flatMap((prefix) => [
      ...(stageHost ? [{ source: `/${prefix}/:path*`, destination: `${stageHost}/${prefix}/:path*` }] : []),
      ...(prodHost
        ? [{ source: `${PROD_ASSET_PREFIX}/${prefix}/:path*`, destination: `${prodHost}/${prefix}/:path*` }]
        : []),
    ]);
  },
};

export default nextConfig;
