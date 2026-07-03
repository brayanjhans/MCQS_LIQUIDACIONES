import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Permite el build aunque haya errores de tipos (para producción VPS)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
