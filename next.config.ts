import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Two build targets, one config
// ---------------------------------------------------------------------------
// Vercel (the production host — see DEPLOYMENT.md) gets a normal `.next` build.
//
// Next.js 16.3 no longer emits `.next/next-server.js.nft.json` while an adapter
// is active, but Vercel's `onBuildComplete` step still reads that file, so an
// unconditional `output: "standalone"` makes every Vercel deploy fail with
//   ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
// (vercel/next.js#96646, still open). Vercel sets `VERCEL=1` in its build
// environment, so standalone is enabled only when that marker is absent — i.e.
// for the self-hosted VPS/Docker bundle. Do NOT make this unconditional.
//
// Self-hosted / VPS / Docker (`npm run bundle`, or `docker build`) gets a traced
// `standalone` build written to `dist/`: the deployable artefact is
// `dist/standalone/server.js` plus its own `node_modules` (no `npm install` on
// the server). Preview it with `node --env-file=.env.local
// dist/standalone/server.js`; `npm run start` still serves `dist/` locally but
// Next.js warns that `next start` is not the runner for standalone output.
const isVercelBuild = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  output: isVercelBuild ? undefined : "standalone",
  distDir: isVercelBuild ? ".next" : "dist",

  turbopack: {
    // Workspace root IS the project root here (no monorepo parent needed).
    root: __dirname,
  },

  // Security headers applied to every response (Vercel applies these via
  // middleware when possible; this is the fallback for static/assets).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https: blob:", // 'unsafe-inline' required by Next.js hydration w/o nonce; tighten later if a nonce-based approach is adopted
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.firebaseio.com https://*.firestore.googleapis.com https://*.auth.googleapis.com https://firestore.googleapis.com wss://*.ws.firebaseio.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
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

// Warn at build time if required PUBLIC env vars are missing. The app still
// builds (so CI isn't blocked by missing secrets), but deploys without them
// will fail at runtime — this surfaces the problem early.
const requiredPublicEnv = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const missing = requiredPublicEnv.filter(
  (key) => !process.env[key] && process.env.NODE_ENV === "production"
);

if (missing.length > 0 && process.env.NODE_ENV === "production") {
  console.warn(
    `[WARNING] Production build missing public env vars: ${missing.join(", ")}. ` +
      "The app will build but client-side Firebase will fail at runtime. " +
      "Set these in Vercel → Project Settings → Environment Variables."
  );
}

export default nextConfig;
