/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @helf/ui ships ESM + a bundled stylesheet; let Next process it.
  transpilePackages: ['@helf/ui'],
};

export default nextConfig;
