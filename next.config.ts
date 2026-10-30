import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/carousel-google-maps", permanent: false }];
  },
};

export default nextConfig;
