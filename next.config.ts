import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The app is previewed from a proxied host, which is a different origin from
     the dev server's own. Next blocks its dev resources across origins unless
     the host is named, and the preview would otherwise load without hydration
     or hot reload. */
  allowedDevOrigins: ["*.e2b.app", "*.vercel.app"],
};

export default nextConfig;
