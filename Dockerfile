# Multi-stage build for Next.js production image (dread-lol)

# Stage 1: Dependencies
FROM public.ecr.aws/docker/library/node:20-alpine AS deps
# Use the image's bundled npm (10.x) for reproducible `npm ci`; upgrading npm
# globally can change lockfile validation vs developers and other CI jobs.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Some builders (Docker Build Cloud, etc.) inject NODE_ENV=production. That can omit
# devDependencies and break `next build` (Tailwind, TypeScript, eslint-config-next, …).
ENV NODE_ENV=development
# Registry flakiness in remote builders
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000

# Require a committed lockfile — `npm ci` fails fast if package.json and lock drift.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund && \
    npm cache clean --force

# Stage 2: Builder
FROM public.ecr.aws/docker/library/node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SITE_URL=https://dread.lol
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Runner (production)
FROM public.ecr.aws/docker/library/node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache su-exec

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/content ./content
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json /app/package-lock.json* ./
RUN npm install discord.js ioredis mongodb --omit=dev --ignore-scripts && npm cache clean --force
RUN chmod +x scripts/entrypoint.sh

# Entrypoint runs as root to chown FILE_STORAGE_PATH on the mounted volume, then drops to nextjs via su-exec.

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "scripts/entrypoint.sh"]
