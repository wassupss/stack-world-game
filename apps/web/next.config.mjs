/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@stack-world/shared"],
  experimental: {
    // App Router 안정화
  },
};

export default nextConfig;
