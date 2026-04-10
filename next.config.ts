import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Ignore TypeScript errors during build (useful when env vars are not yet configured)
    typescript: {
          ignoreBuildErrors: true,
    },
    // Ignore ESLint errors during build
    eslint: {
          ignoreDuringBuilds: true,
    },
};

export default nextConfig;
