# ─── Stage 1: build ────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ─── Stage 2: runtime ──────────────────────────────────────────────
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy build output and runtime dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "start"]
