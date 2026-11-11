import type { NextConfig } from 'next';

// AEM fragments reference assets as root-relative paths; forward those to the AEM host.
const AEM_ASSET_PATHS = ['/etc.clientlibs/:path*', '/etc/designs/:path*', '/content/dam/:path*'];

const nextConfig: NextConfig = {
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
