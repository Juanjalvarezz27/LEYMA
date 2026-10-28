import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compresión gzip/brotli en respuestas HTTP
  compress: true,

  // Quitar header "X-Powered-By: Next.js"
  poweredByHeader: false,
};

export default nextConfig;
