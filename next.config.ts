import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ==========================================================================
  // PARALLEL DEPLOYMENT: Coexist with Binary Evolution at pcgscreening.com
  //
  // Strategy A (RECOMMENDED): Deploy to subdomain (app.pcgscreening.com)
  //   - No config needed here. Just add a CNAME record for the subdomain.
  //   - Zero risk to existing pcgscreening.com/sign-in
  //
  // Strategy B: Cloudflare proxy — configured at Cloudflare, not here.
  //
  // Strategy C: Vercel rewrites — uncomment the block below to proxy
  //   /sign-in requests to the Binary Evolution server.
  // ==========================================================================

  // UNCOMMENT FOR STRATEGY C (Vercel rewrites to Binary Evolution):
  // async rewrites() {
  //   return {
  //     beforeFiles: [
  //       {
  //         source: '/sign-in',
  //         destination: 'https://3.218.14.232/sign-in',
  //       },
  //       {
  //         source: '/sign-in/:path*',
  //         destination: 'https://3.218.14.232/sign-in/:path*',
  //       },
  //       {
  //         source: '/admin/sign-in',
  //         destination: 'https://3.218.14.232/admin/sign-in',
  //       },
  //     ],
  //     afterFiles: [],
  //     fallback: [],
  //   };
  // },
};

export default nextConfig;
