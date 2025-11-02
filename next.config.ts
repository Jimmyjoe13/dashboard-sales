import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'dashboard-sales';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: isProd ? `/${repoName}/` : '',
  basePath: isProd ? `/${repoName}` : '',
};

export default nextConfig;
