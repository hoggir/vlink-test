/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path untuk production di nginx /book
  basePath: process.env.NODE_ENV === 'production' ? '/book' : '',

  // Asset prefix untuk static files
  assetPrefix: process.env.NODE_ENV === 'production' ? '/book' : '',
};

export default nextConfig;
