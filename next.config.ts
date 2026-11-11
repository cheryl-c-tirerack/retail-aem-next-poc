import type { NextConfig } from 'next';

// AEM fragments reference assets as root-relative paths; forward those to the AEM host.
const AEM_ASSET_PATHS = ['/etc.clientlibs/:path*', '/etc/designs/:path*', '/content/dam/:path*'];

const isDev = process.env.NODE_ENV === 'development';

// Safety net behind the keep list: the browser blocks any request to a host not listed here
// (Adobe Launch, analytics, vendors) and logs a CSP violation. 'unsafe-inline' is accepted for
// the POC because the kept AEM inline scripts need it. Dev mode adds what React refresh needs.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.tirerack.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://www.tirerack.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https://www.tirerack.com",
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
  async rewrites() {
    const aemHost = process.env.AEM_HOST;

    if (!aemHost) {
      return [];
    }

    return AEM_ASSET_PATHS.map((source) => ({
      source,
      destination: `${aemHost}${source}`,
    }));
  },
};

export default nextConfig;
