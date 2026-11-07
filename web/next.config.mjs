const isProd = process.env.NODE_ENV === 'production';
const apiOrigin = process.env.API_ORIGIN || 'http://localhost:8080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds (rewrites don't work with export).
  ...(isProd ? { output: 'export', trailingSlash: false } : {}),
  images: { unoptimized: true },
  ...(!isProd
    ? {
        async rewrites() {
          return [
            { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
            { source: '/login', destination: `${apiOrigin}/login` },
            { source: '/callback', destination: `${apiOrigin}/callback` },
            { source: '/logout', destination: `${apiOrigin}/logout` },
          ];
        },
      }
    : {}),
};

export default nextConfig;
