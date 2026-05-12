import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
    styledJsx: true,
  },
  distDir: '.next',
  allowedDevOrigins: ['5.189.191.35', 'localhost', 'gateway.eavi.shop', 'vercel.app'],
};

export default nextConfig;
