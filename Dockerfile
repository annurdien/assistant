# ═══════════════════════════════════════
#  STAGE 1: Builder
#  Installs build tools + compiles the source
# ═══════════════════════════════════════
FROM node:25-alpine AS builder

# Build-time OS deps: openssl for Prisma, python3/make/g++ for native addons, git for pnpm deps
RUN apk add --no-cache openssl python3 make g++ git

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.12.0

# Copy workspace manifest files first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

# Copy all source files
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
COPY docs ./docs

# Install dependencies
RUN pnpm install

# Generate Prisma client & build all packages
RUN pnpm --filter @assistant/database run db:generate
RUN pnpm build

# ═══════════════════════════════════════
#  STAGE 2: Production runtime
#  Lean image — no build tools, no root
# ═══════════════════════════════════════
FROM node:25-alpine AS runtime

# Only runtime OS dep needed
RUN apk add --no-cache openssl

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install pnpm in the runtime image
RUN npm install -g pnpm@9.12.0

# Copy the built workspace from the builder stage
COPY --from=builder /app ./

# Fix ownership so the non-root user can write to the wa-auth-session volume
RUN mkdir -p /app/apps/whatsapp-service/wa-auth-session && \
    chown -R appuser:appgroup /app

USER appuser

# API Server = 3000 | WhatsApp Service = 3001 | Dashboard = 5173
EXPOSE 3000 3001 5173

CMD ["pnpm", "run", "start:prod"]
