import type { NextConfig } from "next";
import { adminPathSegment } from "./lib/admin-path-segment";
import { securityHeaders } from "./lib/security-headers";

const adminSegment = adminPathSegment();

// ---------------------------------------------------------------------------
// Two build targets, one config
// ---------------------------------------------------------------------------
// The build folder is always `.next` — local, self-hosted, and Vercel.
//
// Next.js 16.3 no longer emits `.next/next-server.js.nft.json` while an adapter
// is active, but Vercel's `onBuildComplete` step still reads that file, so an
// unconditional `output: "standalone"` makes every Vercel deploy fail with
//   ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
// (vercel/next.js#96646, still open). Vercel sets `VERCEL=1` in its build
// environment, so standalone is enabled only when that marker is absent.
// Do NOT make standalone unconditional, and do not set a custom distDir.
//
// Self-hosted (`npm run bundle`) gets a traced standalone server at
// `.next/standalone/server.js` plus its own `node_modules`. Preview it with
// `node --env-file=.env .next/standalone/server.js`. `next start` warns that it
// is not the runner for standalone output.
const isVercelBuild = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  output: isVercelBuild ? undefined : "standalone",

  turbopack: {
    // Workspace root IS the project root here (no monorepo parent needed).
    root: __dirname,
  },

  // Same policy as proxy.ts (lib/security-headers.ts). This copy covers paths
  // the proxy matcher skips. Do not fork a looser CSP here.
  poweredByHeader: false,
  // Hides the built-in Next.js "N" badge that floats over the page in `next dev`.
  devIndicators: false,
  env: {
    NEXT_PUBLIC_ADMIN_PATH: adminSegment,
  },

  // Organizer pages stay in app/admin for the server. The browser only sees
  // /{sha256}/… ; a direct /admin request is rejected in proxy.ts.
  async rewrites() {
    return [
      { source: `/${adminSegment}`, destination: "/admin" },
      { source: `/${adminSegment}/:path*`, destination: "/admin/:path*" },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(),
      },
    ];
  },

  // Images — restrict to domains we actually use so the optimized <Image>
  // proxy can't be abused to proxy arbitrary origin images.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Redirects — catch old/alternate paths and point them at canonical URLs.
  //
  // Do NOT hand-roll trailing-slash normalization here. Next.js already does
  // it through the `trailingSlash` option (false by default → `/about/` is
  // 308-redirected to `/about`), and a rule that adds a trailing slash would
  // fight that normalizer and loop. Next.js also only accepts a *string*
  // `destination`; a function `destination` or a `regex` field makes
  // `next build` fail with "Invalid redirect found".
  async redirects() {
    return [
      // Legacy/gtld variants — add entries here if the event ever migrated
      // domains. Example:
      // {
      //   source: "/old-path",
      //   destination: "/new-path",
      //   permanent: true,
      // },
    ];
  },

  // Compression is on by default in Next.js production. Keep it explicit so
  // the intent is documented.
  compress: true,

  // Logging: suppress noisy Next.js build warnings in CI; real errors still
  // surface as build failures.
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  experimental: {
    // Derive the build-worker count from available memory instead of raw CPU
    // count. Next defaults `experimental.cpus` to `cpus().length - 1` — 15 on a
    // 16-core machine — and 15 page-data workers do not fit when the box is low
    // on free RAM: each one aborts with
    //   FATAL ERROR: Zone Allocation failed - process out of memory
    // and `next build` exits 134 before writing `.next`. With this flag Next
    // uses min(cpus, floor(freeGB)) with a floor of 4, so a loaded laptop still
    // builds while a roomier CI/Vercel runner keeps parallelising.
    memoryBasedWorkersCount: true,
  },

  // Other experimental knobs — tighten if/when adopted:
  // experimental: {
  //   optimizeCss: true,
  // },
};

if (process.env.NODE_ENV === "production" && !process.env.FIREBASE_WEB_API_KEY?.trim()) {
  console.warn(
    "[WARNING] Production build is missing FIREBASE_WEB_API_KEY. " +
      "Admin sign-in calls Firebase on the server and this key must stay out of the browser. " +
      "Set it in Vercel → Project Settings → Environment Variables (not as NEXT_PUBLIC_)."
  );
}

export default nextConfig;