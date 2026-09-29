# syntax=docker/dockerfile:1
#
# WOLF IDEA PITCH 2026 — self-hosted image (VPS / Docker).
# Build context is this folder (the repo root). See DEPLOYMENT.md
# "Self-hosting (VPS / Docker)" for the full checklist.
#
#   docker build -t wolf-idea-pitch \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain \
#     .
#   docker run --env-file .env -p 3000:3000 wolf-idea-pitch
#
# NEXT_PUBLIC_SITE_URL is inlined into the client bundle at BUILD time.
# FIREBASE_WEB_API_KEY, the Admin SDK key, SMTP, and ADMIN_EMAILS are read at
# RUNTIME only and must be passed with `--env-file`/`-e`. `.env*` is excluded
# via .dockerignore, so those secrets are not baked into an image layer.

# ---- build stage ----------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies first so this layer survives app-code-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_SITE_URL=""
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# VERCEL must be unset: it is what switches next.config.ts to the `.next`
# (Vercel) branch, which produces no standalone bundle to run here.
RUN [ -z "$VERCEL" ] || { echo "ERROR: VERCEL is set in the build environment; unset it to build the standalone .next bundle"; exit 1; }
RUN npm run build

# ---- runtime stage --------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Traced standalone server + its own node_modules (no npm install at runtime).
COPY --from=builder --chown=node:node /app/.next/standalone ./
# next build leaves these two out of the standalone folder on purpose.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]
