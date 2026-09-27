import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GramJS (the Telegram account check) is loaded by Node at run time, not bundled.
  serverExternalPackages: ['telegram'],
  async rewrites() {
    return [
      // public/photos was a duplicate of public/images/events. Saved pages
      // (db.json, Supabase) may still reference the old /photos/ URLs.
      { source: "/photos/:file*", destination: "/images/events/:file*" },
    ];
  },
};

export default nextConfig;
