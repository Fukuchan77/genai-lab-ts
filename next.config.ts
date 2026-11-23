import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recommended for every app as of Next.js 16.4. Separates the static shell from the dynamic AI response.
  cacheComponents: true,
  // Partial Prefetching is adopted one route at a time: when a route is ready, export
  // `prefetch = 'partial'` from its page or layout. Turn this on, and drop those exports, once every
  // route has adopted it. See node_modules/next/dist/docs/01-app/02-guides/adopting-partial-prefetching.md.
  partialPrefetching: false,
  // AGENTS.md is maintained by hand. Both options default to on and make `next dev` rewrite managed
  // blocks in it on every start; the useful guidance is kept in its own section instead.
  agentRules: false,
  experimental: {
    agentUpgrade: false,
  },
};

export default nextConfig;
