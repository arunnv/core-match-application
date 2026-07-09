# ── Stage 1: dependency install ──────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install OS libs needed by native modules (pdf-parse, bcryptjs)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts


# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Provide a dummy DATABASE_URL so drizzle/next don't fail at build time
# Real env vars are injected at runtime by Coolify
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV NEXTAUTH_URL=https://placeholder.example.com
ENV NEXTAUTH_SECRET=build-time-placeholder-not-used-at-runtime

RUN npm run build


# ── Stage 3: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js telemetry off
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone build output + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public

# Copy migrations so we can run them inside the container if needed
COPY --from=builder --chown=nextjs:nodejs /app/db/migrations  ./db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json   ./package.json

# Reuse node_modules from builder — drizzle-kit/drizzle-orm/postgres already installed there
# This avoids an 80-second npm install on every deploy
COPY --from=builder --chown=nextjs:nodejs /app/node_modules   ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run migrations then start the server
CMD ["sh", "-c", "npx drizzle-kit migrate && node server.js"]
