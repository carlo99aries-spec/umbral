# Umbral — production image
#
# Not a standalone build on purpose: v0.1 keeps the Prisma CLI available at
# runtime so the container can apply the schema on boot. Optimising to
# `output: "standalone"` is tracked as a follow-up.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---------------------------------------------------------------- deps
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------- builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Generate the Postgres-flavoured Prisma client, then build against it.
RUN node scripts/sync-schema.mjs \
 && npx prisma generate --schema prisma/schema.postgres.prisma \
 && npx next build

# -------------------------------------------------------------- runner
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# node_modules comes from the builder, not deps: the Prisma client is generated
# there against the Postgres schema. Copying from deps ships an uninitialised
# client that throws "@prisma/client did not initialize yet" at runtime.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh \
 && addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs \
 && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
