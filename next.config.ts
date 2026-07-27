import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next build` and `next dev` both own `.next/`, so a build run while the dev
  // server is up overwrites the chunks the open browser tab is still asking for
  // and the page renders with no CSS. `npm run build:check` sets this to a
  // throwaway directory; deploys and CI leave it unset and keep using `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
